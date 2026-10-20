import Link from "next/link";
import { collectPages } from "@/lib/collect-pages";
import { FolderClosed, File } from "lucide-react";
import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/authz/access";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { FileUploader } from "@/components/vault/file-uploader";
import { DownloadButton } from "@/components/vault/download-button";
import { createProject, recoverUpload } from "@/app/actions/vault";
import { fileSize } from "@/lib/vault";
import { uuid } from "@/lib/forms";
import { Pagination } from "@/components/ui/pagination";
import { pageNumber, pageRange } from "@/lib/pagination";
export default async function Vault({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ project?: string; page?: string }>;
}) {
  const { supabase, team, user } = await requireTeam((await params).teamSlug);
  const query = await searchParams;
  const page = pageNumber(query.page),
    project = query.project;
  if (project && project !== "standalone" && !uuid.safeParse(project).success)
    notFound();
  const projects = await collectPages((from, to) =>
    supabase
      .from("vault_projects")
      .select("*")
      .eq("team_id", team.id)
      .order("name")
      .order("id")
      .range(from, to),
  );
  if (
    project &&
    project !== "standalone" &&
    !projects.some((p) => p.id === project)
  )
    notFound();
  let request = supabase
    .from("vault_files")
    .select("*")
    .eq("team_id", team.id)
    .eq("ready", true)
    .order("created_at", { ascending: false })
    .order("id")
    .range(...pageRange(page));
  if (project === "standalone") request = request.is("project_id", null);
  else if (project) request = request.eq("project_id", project);
  const [filesResult, pendingResult] = await Promise.all([
    request,
    supabase
      .from("vault_files")
      .select("*")
      .eq("team_id", team.id)
      .eq("created_by", user.id)
      .eq("ready", false)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (filesResult.error || pendingResult.error)
    throw new Error("Could not load vault files.");
  const files = filesResult.data ?? [],
    base = `/t/${team.slug}/vault`;
  return (
    <>
      <PageHeader
        eyebrow={`${team.name} / Files`}
        title="Everything in its place."
        description="A private home for project files, useful documents, and the work you share."
      />
      <div className="management-grid">
        <FileUploader
          key={project ?? "all"}
          teamSlug={team.slug}
          projects={projects}
          projectId={project === "standalone" ? undefined : project}
        />
        <div className="panel">
          <h2>A folder for your next project.</h2>
          <p className="muted small">
            Keep related files together. Everyone on the team can add to a
            project.
          </p>
          <ActionForm action={createProject} className="stack">
            <input name="team_slug" value={team.slug} type="hidden" />
            <label>
              Project name
              <input
                name="name"
                placeholder="e.g. Website refresh"
                maxLength={100}
                required
              />
            </label>
            <div>
              <SubmitButton className="button secondary">
                ＋ Create project
              </SubmitButton>
            </div>
          </ActionForm>
        </div>
      </div>
      <div className="section-heading">
        <h2>Your vault</h2>
        <span className="tag">Team members only</span>
      </div>
      <nav className="folder-tabs" aria-label="Vault folders">
        <Link className={`folder-tab ${!project ? "active" : ""}`} href={base}>
          All files
        </Link>
        <Link
          className={`folder-tab ${project === "standalone" ? "active" : ""}`}
          href={`${base}?project=standalone`}
        >
          Standalone
        </Link>
        {projects.map((item) => (
          <Link
            key={item.id}
            className={`folder-tab ${project === item.id ? "active" : ""}`}
            href={`${base}?project=${item.id}`}
          >
            <FolderClosed size={14} />
            {item.name}
          </Link>
        ))}
      </nav>
      {files.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Project</th>
                <th>Size</th>
                <th>
                  <span className="sr-only">Download</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="button-row">
                      <File size={16} />
                      {file.name}
                    </span>
                  </td>
                  <td className="muted">
                    {projects.find((p) => p.id === file.project_id)?.name ??
                      "Standalone"}
                  </td>
                  <td className="muted">{fileSize(file.size)}</td>
                  <td>
                    <DownloadButton path={file.storage_path} name={file.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Your files will feel at home here.">
          Upload a file above, or create a project to keep things organized.
        </EmptyState>
      )}
      <Pagination
        page={page}
        count={files.length}
        base={base}
        query={project ? { project } : {}}
      />
      {!!pendingResult.data?.length && (
        <details className="panel" style={{ marginTop: 24 }}>
          <summary>Your incomplete uploads</summary>
          <p className="small muted">
            Finish a completed transfer or clear an interrupted upload before
            trying again.
          </p>
          {pendingResult.data.map((file) => (
            <div className="list-row" key={file.id}>
              <span>{file.name}</span>
              <div className="button-row">
                {["finish", "clear"].map((operation) => (
                  <ActionForm action={recoverUpload} key={operation}>
                    <input name="team_slug" value={team.slug} type="hidden" />
                    <input name="id" value={file.id} type="hidden" />
                    <input name="operation" value={operation} type="hidden" />
                    <SubmitButton className="button secondary small">
                      {operation === "finish"
                        ? "Finish upload"
                        : "Clear upload"}
                    </SubmitButton>
                  </ActionForm>
                ))}
              </div>
            </div>
          ))}
        </details>
      )}
    </>
  );
}
