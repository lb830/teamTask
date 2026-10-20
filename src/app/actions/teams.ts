"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireSuperuser } from "@/lib/authz/access";
import {
  field,
  slugSchema,
  slugify,
  uuid,
  type ActionState,
} from "@/lib/forms";
export async function createTeam(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const name = field(form, "name");
  if (!name || name.length > 80)
    return { error: "Use a team name between 1 and 80 characters." };
  const slug = slugSchema.safeParse(field(form, "slug") || slugify(name));
  if (!slug.success)
    return {
      error: "Choose a URL with lowercase letters, numbers, and hyphens.",
    };
  const { error } = await supabase.rpc("create_team", {
    team_name: name,
    team_slug: slug.data,
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "This team URL is already in use. Choose another."
          : "Could not create the team. Check your administrator permissions.",
    };
  revalidatePath("/", "layout");
  redirect(`/t/${slug.data}/wiki`);
}
export async function changeRole(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireSuperuser();
  const id = uuid.safeParse(field(form, "user_id"));
  const role = field(form, "role");
  if (!id.success || (role !== "admin" && role !== "member"))
    return { error: "Choose a valid account and role." };
  const { error } = await supabase.rpc("set_account_role", {
    target_user: id.data,
    new_role: role,
  });
  if (error) return { error: "This account’s role could not be changed." };
  revalidatePath("/admin");
  return { success: "Account role updated. Team memberships are unchanged." };
}
export async function suspendAccount(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireSuperuser();
  const id = uuid.safeParse(field(form, "user_id"));
  if (!id.success) return { error: "Invalid account." };
  const { error } = await supabase.rpc("set_account_suspended", {
    target_user: id.data,
    is_suspended: field(form, "suspended") === "true",
  });
  if (error) return { error: "This account could not be updated." };
  revalidatePath("/admin");
  return { success: "Account access updated." };
}
export async function removeMember(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const teamId = uuid.safeParse(field(form, "team_id"));
  const userId = uuid.safeParse(field(form, "user_id"));
  if (!teamId.success || !userId.success) return { error: "Invalid member." };
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId.data)
    .eq("user_id", userId.data);
  if (error) return { error: "Could not remove this member." };
  revalidatePath("/", "layout");
  return {
    success: "Membership removed. Their team content stays with the team.",
  };
}
