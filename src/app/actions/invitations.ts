"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authz/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { invitationConfig, sendInvitation } from "@/lib/email/resend";
import { hashToken, newToken, lookupInvitation } from "@/lib/invitations";
import {
  emailSchema,
  field,
  rawField,
  passwordSchema,
  uuid,
  type ActionState,
} from "@/lib/forms";

export async function invite(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase, user, profile } = await requireAdmin();
  const email = emailSchema.safeParse(field(form, "email"));
  const teamId = field(form, "team_id");
  const kind = teamId ? "team" : "admin";
  if (!email.success) return { error: "Enter a valid email address." };
  if (kind === "admin" && profile.role !== "superuser")
    return { error: "Only the superuser can invite global admins." };
  if (teamId && !uuid.safeParse(teamId).success)
    return { error: "Choose a valid team." };
  try {
    invitationConfig();
  } catch {
    return {
      error:
        "Configure Resend, APP_URL, and the Supabase service key before inviting people.",
    };
  }
  const token = newToken();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      email: email.data,
      kind,
      team_id: teamId || null,
      token_hash: hashToken(token),
      invited_by: user.id,
    })
    .select("id")
    .single();
  if (error)
    return {
      error:
        "Could not create this invitation. Check your permissions and team.",
    };
  let sent = false;
  try {
    sent = await sendInvitation(email.data, token, kind);
  } catch {
    /* Show a recoverable delivery state, never email-provider details. */
  }
  await supabase
    .from("invitations")
    .update({ delivery_status: sent ? "sent" : "failed" })
    .eq("id", data.id);
  revalidatePath("/admin", "layout");
  return sent
    ? { success: "Invitation sent. It expires in seven days." }
    : {
        error:
          "The invitation was saved, but email delivery failed. Check Resend and use Resend invitation below.",
      };
}
export async function manageInvitation(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = uuid.safeParse(field(form, "id"));
  if (!id.success) return { error: "Invalid invitation." };
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", id.data)
    .is("accepted_at", null)
    .maybeSingle();
  if (!invitation)
    return { error: "This invitation is unavailable or already accepted." };
  if (field(form, "operation") === "revoke") {
    const { data, error } = await supabase
      .from("invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id.data)
      .is("accepted_at", null)
      .select("id");
    if (error || !data?.length)
      return { error: "Could not revoke this invitation." };
    revalidatePath("/admin", "layout");
    return { success: "Invitation revoked." };
  }
  if (invitation.revoked_at)
    return { error: "This invitation was revoked. Create a new invitation." };
  try {
    invitationConfig();
  } catch {
    return { error: "Email delivery has not been configured." };
  }
  const token = newToken();
  const { data, error } = await supabase
    .from("invitations")
    .update({
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + 7 * 86400000 - 10000).toISOString(),
      delivery_status: "pending",
    })
    .eq("id", id.data)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .select("id");
  if (error || !data?.length)
    return { error: "The invitation changed. Refresh and try again." };
  let sent = false;
  try {
    sent = await sendInvitation(invitation.email, token, invitation.kind);
  } catch {
    /* Delivery failures can be retried. */
  }
  await supabase
    .from("invitations")
    .update({ delivery_status: sent ? "sent" : "failed" })
    .eq("id", id.data)
    .eq("token_hash", hashToken(token));
  revalidatePath("/admin", "layout");
  return sent
    ? { success: "New invitation sent. The previous link is invalid." }
    : {
        error: "Email delivery failed. Check Resend and resend the invitation.",
      };
}
export async function acceptInvitation(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let invitation;
  const token = field(form, "token");
  try {
    invitation = await lookupInvitation(token);
  } catch {
    return {
      error: "Invitations are not configured. Contact your administrator.",
    };
  }
  if (!invitation)
    return {
      error:
        "This invitation has expired, was revoked, or has already been used.",
    };
  const supabase = await createClient();
  const {
    data: { user: signedIn },
  } = await supabase.auth.getUser();
  if (signedIn?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    const password = rawField(form, "password");
    const admin = createAdminClient();
    const { data: existing, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("email", invitation.email.toLowerCase())
      .maybeSingle();
    if (lookupError)
      return {
        error: "Could not look up your invitation account. Try again later.",
      };
    if (!existing) {
      if (!passwordSchema.safeParse(password).success)
        return { error: "Choose a password between 12 and 128 characters." };
      if (password !== rawField(form, "confirm"))
        return { error: "Your passwords do not match." };
      const { error } = await admin.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: { display_name: field(form, "name").slice(0, 100) },
      });
      if (error)
        return {
          error:
            "Could not create your account. If you already accepted another invitation, sign in and reopen this link.",
        };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    });
    if (error)
      return {
        error:
          "Sign in with your existing account password, or reset it from the sign-in page.",
      };
  }
  const { data: teamId, error } = await supabase.rpc("accept_invitation", {
    invite_hash: hashToken(token),
  });
  if (error)
    return {
      error:
        "This invitation is no longer available. Ask your administrator for a new one.",
    };
  revalidatePath("/", "layout");
  if (teamId) {
    const { data: team } = await supabase
      .from("teams")
      .select("slug")
      .eq("id", teamId)
      .single();
    if (team) redirect(`/t/${team.slug}/wiki`);
  }
  redirect("/admin");
}
