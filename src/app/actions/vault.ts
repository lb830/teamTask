"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireTeam } from "@/lib/authz/access";
import { field, uuid, type ActionState } from "@/lib/forms";
import { fileError, storageName } from "@/lib/vault";
export async function createProject(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase, user, team } = await requireTeam(field(form, "team_slug"));
  const name = field(form, "name");
  if (!name || name.length > 100)
    return { error: "Use a project name between 1 and 100 characters." };
  const { error } = await supabase
    .from("vault_projects")
    .insert({ team_id: team.id, name, created_by: user.id });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "A project with this name already exists."
          : "Could not create this project.",
    };
  revalidatePath(`/t/${team.slug}/vault`);
  return { success: "Project folder created." };
}
export async function beginUpload(
  teamSlug: string,
  input: { name: string; size: number; projectId: string | null },
) {
  const { supabase, user, team } = await requireTeam(teamSlug);
  if (
    !input ||
    typeof input.name !== "string" ||
    input.name.length > 1000 ||
    typeof input.size !== "number"
  )
    return { error: "Invalid file." };
  const problem = fileError(input.name, input.size);
  if (problem) return { error: problem };
  if (input.projectId) {
    if (!uuid.safeParse(input.projectId).success)
      return { error: "Choose a valid project." };
    const { data: project } = await supabase
      .from("vault_projects")
      .select("id")
      .eq("id", input.projectId)
      .eq("team_id", team.id)
      .maybeSingle();
    if (!project)
      return { error: "This project is not available in your team." };
  }
  const id = randomUUID(),
    name = storageName(input.name);
  const path = `${team.id}/${id}/${name}`;
  const { error } = await supabase
    .from("vault_files")
    .insert({
      id,
      team_id: team.id,
      project_id: input.projectId || null,
      name,
      storage_path: path,
      size: input.size,
      content_type: "application/octet-stream",
      created_by: user.id,
    });
  if (error)
    return {
      error: "Could not prepare this upload. Check your team membership.",
    };
  return { id, path, name };
}
export async function finishUpload(
  teamSlug: string,
  fileId: string,
): Promise<ActionState> {
  const { supabase, team, user } = await requireTeam(teamSlug);
  if (!uuid.safeParse(fileId).success) return { error: "Invalid file." };
  const { data } = await supabase
    .from("vault_files")
    .select("id")
    .eq("id", fileId)
    .eq("team_id", team.id)
    .eq("created_by", user.id)
    .maybeSingle();
  if (!data) return { error: "This upload is unavailable." };
  const { error } = await supabase.rpc("finalize_upload", { file_id: fileId });
  if (error)
    return { error: "The file is not fully uploaded yet. Retry the upload." };
  revalidatePath(`/t/${team.slug}/vault`);
  return { success: "File uploaded to the team vault." };
}
export async function cancelUpload(
  teamSlug: string,
  fileId: string,
): Promise<ActionState> {
  const { supabase, team, user } = await requireTeam(teamSlug);
  if (!uuid.safeParse(fileId).success) return { error: "Invalid file." };
  const { data } = await supabase
    .from("vault_files")
    .select("storage_path")
    .eq("id", fileId)
    .eq("team_id", team.id)
    .eq("created_by", user.id)
    .eq("ready", false)
    .maybeSingle();
  if (!data) return { error: "This incomplete upload is unavailable." };
  const { error: storageError } = await supabase.storage
    .from("team-vault")
    .remove([data.storage_path]);
  if (storageError)
    return {
      error: "Could not remove the incomplete upload. Try again later.",
    };
  const { error } = await supabase
    .from("vault_files")
    .delete()
    .eq("id", fileId)
    .eq("team_id", team.id)
    .eq("created_by", user.id)
    .eq("ready", false);
  if (error) return { error: "Could not clear the incomplete upload." };
  revalidatePath(`/t/${team.slug}/vault`);
  return { success: "Incomplete upload cleared." };
}
export async function recoverUpload(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  return field(form, "operation") === "finish"
    ? finishUpload(field(form, "team_slug"), field(form, "id"))
    : cancelUpload(field(form, "team_slug"), field(form, "id"));
}
