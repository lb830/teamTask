"use client";
import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { saveWikiPage } from "@/app/actions/wiki";
import { MarkdownView } from "./markdown-view";
import type { WikiPage } from "@/lib/database.types";
export function PageEditor({
  teamSlug,
  page,
}: {
  teamSlug: string;
  page?: WikiPage;
}) {
  const [body, setBody] = useState(page?.body ?? "");
  const [preview, setPreview] = useState(false);
  return (
    <ActionForm action={saveWikiPage} className="stack">
      <input type="hidden" name="team_slug" value={teamSlug} />
      <input type="hidden" name="id" value={page?.id ?? ""} />
      <label>
        Page title
        <input
          name="title"
          defaultValue={page?.title}
          placeholder="Give your knowledge a name"
          maxLength={160}
          required
        />
      </label>
      <div>
        <div className="editor-tabs">
          <button
            className={`button small ${preview ? "secondary" : ""}`}
            type="button"
            aria-pressed={!preview}
            onClick={() => setPreview(false)}
          >
            Write
          </button>
          <button
            className={`button small ${preview ? "" : "secondary"}`}
            type="button"
            aria-pressed={preview}
            onClick={() => setPreview(true)}
          >
            Preview
          </button>
        </div>
        <input name="body" value={body} type="hidden" />
        {preview ? (
          <div className="editor-preview">
            <MarkdownView body={body || "*Your preview will appear here.*"} />
          </div>
        ) : (
          <label>
            Markdown
            <textarea
              className="editor-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={100000}
              placeholder={
                "# Start with an idea\n\nAdd notes, links, checklists, and code for your team."
              }
            />
          </label>
        )}
      </div>
      <div className="button-row">
        <SubmitButton>Save & publish</SubmitButton>
        <span className="small muted">
          Visible to your team as soon as you save.
        </span>
      </div>
    </ActionForm>
  );
}
