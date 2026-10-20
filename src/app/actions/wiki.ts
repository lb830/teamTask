"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeam, isAdminRole } from "@/lib/authz/access";
import { field, rawField, uuid, slugify, type ActionState } from "@/lib/forms";
export async function saveWikiPage(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase, team, user } = await requireTeam(field(form, "team_slug"));
  const id = field(form, "id"),
    title = field(form, "title"),
    body = rawField(form, "body");
  if (!title || title.length > 160 || body.length > 100000)
    return {
      error:
        "Add a title up to 160 characters and a page up to 100,000 characters.",
    };
  let slug: string;
  if (id) {
    if (!uuid.safeParse(id).success) return { error: "Invalid page." };
    const { data, error } = await supabase
      .from("wiki_pages")
      .update({ title, body })
      .eq("id", id)
      .eq("team_id", team.id)
      .select("slug")
      .maybeSingle();
    if (error || !data)
      return { error: "Could not save this page. It may have been removed." };
    slug = data.slug;
  } else {
    slug = `${slugify(title) || "page"}-${randomUUID().slice(0, 8)}`;
    const { error } = await supabase
      .from("wiki_pages")
      .insert({ team_id: team.id, title, body, slug, created_by: user.id });
    if (error) return { error: "Could not publish this page. Try again." };
  }
  revalidatePath(`/t/${team.slug}/wiki`, "layout");
  redirect(`/t/${team.slug}/wiki/${slug}`);
}
export async function deleteWikiPage(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase, team, user, profile } = await requireTeam(
    field(form, "team_slug"),
  );
  const id = uuid.safeParse(field(form, "id"));
  if (!id.success) return { error: "Invalid page." };
  const { data: page } = await supabase
    .from("wiki_pages")
    .select("created_by")
    .eq("id", id.data)
    .eq("team_id", team.id)
    .maybeSingle();
  if (!page || (page.created_by !== user.id && !isAdminRole(profile.role)))
    return {
      error: "Only the author or a team administrator can delete this page.",
    };
  const { error } = await supabase
    .from("wiki_pages")
    .delete()
    .eq("id", id.data)
    .eq("team_id", team.id);
  if (error) return { error: "Could not delete this page." };
  revalidatePath(`/t/${team.slug}/wiki`, "layout");
  redirect(`/t/${team.slug}/wiki`);
}
