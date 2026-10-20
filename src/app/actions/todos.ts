"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAccount, requireTeam, isAdminRole } from "@/lib/authz/access";
import { field, uuid, type ActionState } from "@/lib/forms";
const todoInput = z.object({
  title: z.string().trim().min(1).max(240),
  status: z.enum(["todo", "in_progress", "done"]),
  due_date: z.union([z.iso.date(), z.literal("")]).transform((v) => v || null),
});
export async function saveTodo(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const teamSlug = field(form, "team_slug");
  const teamContext = teamSlug ? await requireTeam(teamSlug) : null;
  const context = teamContext ?? (await requireAccount());
  const { supabase, user } = context;
  const input = todoInput.safeParse({
    title: field(form, "title"),
    status: field(form, "status") || "todo",
    due_date: field(form, "due_date"),
  });
  if (!input.success)
    return {
      error:
        "Add a title up to 240 characters, a valid status, and an optional valid due date.",
    };
  const id = field(form, "id");
  if (id && !uuid.safeParse(id).success) return { error: "Invalid todo." };
  const team = teamContext?.team;
  if (team) {
    const { data, error } = id
      ? await supabase
          .from("team_todos")
          .update(input.data)
          .eq("id", id)
          .eq("team_id", team.id)
          .select("id")
      : await supabase
          .from("team_todos")
          .insert({ ...input.data, team_id: team.id, created_by: user.id })
          .select("id");
    if (error || !data?.length)
      return {
        error: "Could not save this team todo. It may have been removed.",
      };
    revalidatePath(`/t/${team.slug}/todos`);
  } else {
    const { data, error } = id
      ? await supabase
          .from("personal_todos")
          .update(input.data)
          .eq("id", id)
          .eq("created_by", user.id)
          .select("id")
      : await supabase
          .from("personal_todos")
          .insert({ ...input.data, created_by: user.id })
          .select("id");
    if (error || !data?.length)
      return {
        error: "Could not save this private todo. It may have been removed.",
      };
    revalidatePath("/todos");
  }
  return { success: id ? "Todo updated." : "Todo added." };
}
export async function deleteTodo(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const teamSlug = field(form, "team_slug");
  const teamContext = teamSlug ? await requireTeam(teamSlug) : null;
  const context = teamContext ?? (await requireAccount());
  const { supabase, user, profile } = context;
  const id = uuid.safeParse(field(form, "id"));
  if (!id.success) return { error: "Invalid todo." };
  const team = teamContext?.team;
  if (team) {
    const { data: todo } = await supabase
      .from("team_todos")
      .select("created_by")
      .eq("id", id.data)
      .eq("team_id", team.id)
      .maybeSingle();
    if (!todo || (todo.created_by !== user.id && !isAdminRole(profile.role)))
      return {
        error: "Only the creator or a team administrator can delete this todo.",
      };
    const { error } = await supabase
      .from("team_todos")
      .delete()
      .eq("id", id.data)
      .eq("team_id", team.id);
    if (error) return { error: "Could not delete this todo." };
    revalidatePath(`/t/${team.slug}/todos`);
  } else {
    const { error } = await supabase
      .from("personal_todos")
      .delete()
      .eq("id", id.data)
      .eq("created_by", user.id);
    if (error) return { error: "Could not delete this todo." };
    revalidatePath("/todos");
  }
  return { success: "Todo deleted." };
}
