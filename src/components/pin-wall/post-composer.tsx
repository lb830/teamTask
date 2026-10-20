import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { savePost } from "@/app/actions/pin-wall";
import type { WallPost } from "@/lib/database.types";
export function PostComposer({
  teamSlug,
  post,
}: {
  teamSlug: string;
  post?: WallPost;
}) {
  return (
    <ActionForm action={savePost} className="stack">
      <input name="team_slug" value={teamSlug} type="hidden" />
      <input name="id" value={post?.id ?? ""} type="hidden" />
      <label>
        Title
        <input
          name="title"
          defaultValue={post?.title}
          placeholder="What should your team know?"
          maxLength={160}
          required
        />
      </label>
      <label>
        Update <span className="muted">Markdown supported</span>
        <textarea
          name="body"
          defaultValue={post?.body}
          placeholder="Share the news, celebrate a milestone, or pin something important."
          maxLength={20000}
          required
        />
      </label>
      <div>
        <SubmitButton>{post ? "Save changes" : "Publish update"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
