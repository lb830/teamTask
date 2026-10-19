"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "tus-js-client";
import { UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { publicEnv } from "@/lib/supabase/env";
import { beginUpload, finishUpload, cancelUpload } from "@/app/actions/vault";
import { FILE_ACCEPT, fileError, fileSize } from "@/lib/vault";
import type { VaultProject } from "@/lib/database.types";
export function FileUploader({
  teamSlug,
  projects,
  projectId,
}: {
  teamSlug: string;
  projects: VaultProject[];
  projectId?: string;
}) {
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  async function upload(form: FormData) {
    const file = form.get("file");
    if (!(file instanceof File)) return;
    const problem = fileError(file.name, file.size);
    if (problem) {
      setFailed(true);
      setMessage(problem);
      return;
    }
    setBusy(true);
    setProgress(0);
    setMessage("");
    setFailed(false);
    let uploadId: string | undefined;
    try {
      const prepared = await beginUpload(teamSlug, {
        name: file.name,
        size: file.size,
        projectId: String(form.get("project_id") || "") || null,
      });
      if ("error" in prepared) throw new Error(prepared.error);
      uploadId = prepared.id;
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session)
        throw new Error("Your session has expired. Sign in and try again.");
      const { url, key } = publicEnv();
      await new Promise<void>((resolve, reject) => {
        const transfer = new Upload(file, {
          endpoint: `${url}/storage/v1/upload/resumable`,
          retryDelays: [0, 1000, 3000, 5000, 10000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            apikey: key,
            "x-upsert": "false",
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          storeFingerprintForResuming: false,
          chunkSize: 6 * 1024 * 1024,
          metadata: {
            bucketName: "team-vault",
            objectName: prepared.path,
            contentType: "application/octet-stream",
            cacheControl: "0",
          },
          onBeforeRequest: async (request) => {
            const {
              data: { session: current },
            } = await supabase.auth.getSession();
            if (current)
              request.setHeader(
                "authorization",
                `Bearer ${current.access_token}`,
              );
          },
          onProgress: (uploaded, total) =>
            setProgress(Math.round((uploaded / total) * 100)),
          onError: () =>
            reject(
              new Error(
                "Upload interrupted. Check your connection and team membership, then try again.",
              ),
            ),
          onSuccess: () => resolve(),
        });
        transfer.start();
      });
      const result = await finishUpload(teamSlug, prepared.id);
      if (result.error) throw new Error(result.error);
      setMessage(
        `${prepared.name} (${fileSize(file.size)}) is ready in your team vault.`,
      );
      formRef.current?.reset();
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not upload this file. Try again.",
      );
      if (uploadId) {
        try {
          await cancelUpload(teamSlug, uploadId);
        } catch {
          /* Incomplete uploads can be cleared from the vault. */
        }
      }
    } finally {
      setBusy(false);
      router.refresh();
    }
  }
  return (
    <form action={upload} ref={formRef} className="upload-zone">
      <div className="button-row">
        <UploadCloud size={25} />
        <div>
          <h3>Bring your work along.</h3>
          <p className="small muted">
            ZIP, documents, text, CSV, and source code · Up to 100 MB per file
          </p>
        </div>
      </div>
      <label>
        File
        <input
          type="file"
          name="file"
          accept={FILE_ACCEPT}
          required
          disabled={busy}
        />
      </label>
      <label>
        Save to
        <select
          name="project_id"
          defaultValue={projectId ?? ""}
          disabled={busy}
        >
          <option value="">Standalone files</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      {busy && (
        <div>
          <progress max={100} value={progress} aria-label="Upload progress" />
          <p className="small muted" role="status">
            {progress < 100
              ? `Uploading ${progress}% — keep this page open.`
              : "Finishing your upload…"}
          </p>
        </div>
      )}
      <div>
        <button className="button" disabled={busy}>
          {busy ? "Uploading…" : "Upload file"}
        </button>
      </div>
      {message && (
        <p
          className={`notice ${failed ? "error" : "success"}`}
          role={failed ? "alert" : "status"}
        >
          {message}
        </p>
      )}
      <p className="small muted">
        ZIP archives are stored as-is. Files are never unpacked or indexed.
      </p>
    </form>
  );
}
