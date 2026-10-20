import { Pin } from "lucide-react";
import { requireTeam, isAdminRole } from "@/lib/authz/access";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import {
  ActionForm,
  DeleteButton,
  SubmitButton,
} from "@/components/ui/action-form";
import { PostComposer } from "@/components/pin-wall/post-composer";
import { MarkdownView } from "@/components/wiki/markdown-view";
import { deletePost, reactToPost } from "@/app/actions/pin-wall";
import { Pagination } from "@/components/ui/pagination";
import { pageNumber, pageRange } from "@/lib/pagination";
const reactions = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🎉", label: "Celebrate" },
  { emoji: "👀", label: "Seen" },
];
export default async function PinWall({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase, team, profile } = await requireTeam(
    (await params).teamSlug,
  );
  const page = pageNumber((await searchParams).page);
  const { data: posts, error } = await supabase
    .from("wall_posts")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false })
    .order("id")
    .range(...pageRange(page));
  if (error) throw new Error("Could not load pin wall posts.");
  const { data: counts, error: reactionError } = posts?.length
    ? await supabase.rpc("reaction_counts", {
        target_team: team.id,
        post_ids: posts.map((post) => post.id),
      })
    : { data: [], error: null };
  if (reactionError) throw new Error("Could not load reactions.");
  const admin = isAdminRole(profile.role);
  return (
    <>
      <PageHeader
        eyebrow={`${team.name} / Updates`}
        title="Worth pinning."
        description="The news, milestones, and little moments that bring your team together."
      >
        <span className="tag">
          <Pin size={12} /> &nbsp; Team updates
        </span>
      </PageHeader>
      {admin && (
        <details className="panel" style={{ marginBottom: 28 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            ＋ Share an update
          </summary>
          <div style={{ marginTop: 22 }}>
            <PostComposer teamSlug={team.slug} />
          </div>
        </details>
      )}
      <div className="wall-feed">
        {posts?.length ? (
          posts.map((post) => (
            <article className="panel wall-post" key={post.id}>
              <div className="post-meta">
                <span className="avatar">
                  <Pin size={14} />
                </span>
                <span>
                  Team announcement ·{" "}
                  {new Date(post.created_at).toLocaleDateString("en-GB", {
                    timeZone: "UTC",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2>{post.title}</h2>
              <MarkdownView body={post.body} />
              <div className="reaction-bar" aria-label="Reactions">
                {reactions.map((reaction) => {
                  const stats = counts?.find(
                    (count) =>
                      count.post_id === post.id &&
                      count.emoji === reaction.emoji,
                  );
                  const selected = stats?.reacted ?? false;
                  return (
                    <ActionForm action={reactToPost} key={reaction.emoji}>
                      <input name="team_slug" value={team.slug} type="hidden" />
                      <input name="post_id" value={post.id} type="hidden" />
                      <input
                        name="emoji"
                        value={reaction.emoji}
                        type="hidden"
                      />
                      <input
                        name="remove"
                        value={String(selected)}
                        type="hidden"
                      />
                      <SubmitButton
                        className={`reaction-button ${selected ? "selected" : ""}`}
                        pendingLabel="…"
                      >
                        <span
                          role="img"
                          aria-label={`${selected ? "Remove" : "Add"} ${reaction.label} reaction`}
                        >
                          {reaction.emoji}
                        </span>
                        <span>{stats?.total ?? 0}</span>
                      </SubmitButton>
                    </ActionForm>
                  );
                })}
              </div>
              {admin && (
                <details>
                  <summary>Manage post</summary>
                  <div className="stack" style={{ marginTop: 18 }}>
                    <PostComposer teamSlug={team.slug} post={post} />
                    <ActionForm action={deletePost}>
                      <input name="team_slug" value={team.slug} type="hidden" />
                      <input name="id" value={post.id} type="hidden" />
                      <DeleteButton label="Delete post" />
                    </ActionForm>
                  </div>
                </details>
              )}
            </article>
          ))
        ) : (
          <EmptyState title="Good news belongs here.">
            {admin
              ? "Share the first update with your team using the composer above."
              : "Updates from your team administrators will appear here. Add a reaction when something speaks to you."}
          </EmptyState>
        )}
      </div>
      <Pagination
        page={page}
        count={posts?.length ?? 0}
        base={`/t/${team.slug}/wall`}
      />
    </>
  );
}
