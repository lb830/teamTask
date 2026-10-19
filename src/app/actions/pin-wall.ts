"use server";
import { revalidatePath } from "next/cache";
import { requireTeam, isAdminRole } from "@/lib/authz/access";
import { field, rawField, uuid, type ActionState } from "@/lib/forms";
const emojis = ["👍", "❤️", "🎉", "👀"];
export async function savePost(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase, user, profile, team } = await requireTeam(
    field(form, "team_slug"),
  );
  if (!isAdminRole(profile.role))
    return { error: "Only a team administrator can publish posts." };
  const title = field(form, "title"),
    body = rawField(form, "body"),
    id = field(form, "id");
  if (!title || title.length > 160 || !body.trim() || body.length > 20000)
    return {
      error:
        "Add a title up to 160 characters and a post up to 20,000 characters.",
    };
  if (id && !uuid.safeParse(id).success) return { error: "Invalid post." };
  const { data, error } = id
    ? await supabase
        .from("wall_posts")
        .update({ title, body })
        .eq("id", id)
        .eq("team_id", team.id)
        .select("id")
    : await supabase
        .from("wall_posts")
        .insert({ title, body, team_id: team.id, created_by: user.id })
        .select("id");
  if (error || !data?.length)
    return {
      error: "Could not save this post. Check your permissions and try again.",
    };
  revalidatePath(`/t/${team.slug}/wall`);
  return { success: id ? "Post updated." : "Post published to your team." };
}
export async function deletePost(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase, profile, team } = await requireTeam(
    field(form, "team_slug"),
  );
  if (!isAdminRole(profile.role))
    return { error: "Only a team administrator can delete posts." };
  const id = uuid.safeParse(field(form, "id"));
  if (!id.success) return { error: "Invalid post." };
  const { error } = await supabase
    .from("wall_posts")
    .delete()
    .eq("id", id.data)
    .eq("team_id", team.id);
  if (error) return { error: "Could not delete this post." };
  revalidatePath(`/t/${team.slug}/wall`);
  return { success: "Post deleted." };
}
export async function reactToPost(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase, user, team } = await requireTeam(field(form, "team_slug"));
  const id = uuid.safeParse(field(form, "post_id")),
    emoji = field(form, "emoji");
  if (!id.success || !emojis.includes(emoji))
    return { error: "Invalid reaction." };
  const { data: post } = await supabase
    .from("wall_posts")
    .select("id")
    .eq("id", id.data)
    .eq("team_id", team.id)
    .maybeSingle();
  if (!post) return { error: "This post is unavailable." };
  const { error } =
    field(form, "remove") === "true"
      ? await supabase
          .from("wall_reactions")
          .delete()
          .eq("post_id", id.data)
          .eq("user_id", user.id)
          .eq("team_id", team.id)
          .eq("emoji", emoji)
      : await supabase
          .from("wall_reactions")
          .insert({
            post_id: id.data,
            user_id: user.id,
            team_id: team.id,
            emoji,
          });
  if (error && error.code !== "23505")
    return { error: "Could not update your reaction." };
  revalidatePath(`/t/${team.slug}/wall`);
  return {};
}
