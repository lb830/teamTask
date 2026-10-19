"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
export function DownloadButton({ path, name }: { path: string; name: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function download() {
    setBusy(true);
    setError("");
    try {
      // Authenticated requests recheck current RLS membership; no reusable signed URL.
      const { data, error } = await createClient()
        .storage.from("team-vault")
        .download(path);
      if (error || !data)
        throw new Error(
          "This file is unavailable. Check your connection and team membership.",
        );
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setError(
        "Could not download this file. It may no longer be available to you.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="button secondary small"
        onClick={download}
        disabled={busy}
        aria-label={`Download ${name}`}
      >
        <Download size={14} />
        {busy ? "Downloading…" : "Download"}
      </button>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
