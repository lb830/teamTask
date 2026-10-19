import "server-only";
import { Resend } from "resend";
import { appUrl } from "@/lib/config";
export function invitationConfig() {
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.RESEND_FROM ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    throw new Error(
      "Configure Resend and the Supabase service key before sending invitations.",
    );
  return {
    origin: appUrl(),
    from: process.env.RESEND_FROM,
    apiKey: process.env.RESEND_API_KEY,
  };
}
export async function sendInvitation(
  email: string,
  token: string,
  kind: "team" | "admin",
) {
  const config = invitationConfig();
  const resend = new Resend(config.apiKey);
  const { error } = await resend.emails.send({
    from: config.from,
    to: email,
    subject:
      kind === "admin"
        ? "You’re invited to administer teamTask"
        : "Your teamTask invitation",
    text: `You have been invited to ${kind === "admin" ? "become a teamTask administrator" : "join a team on teamTask"}.\n\nAccept your invitation: ${config.origin}/invite/${token}\n\nThis link expires in seven days and can only be used once. If you did not expect this invitation, you can ignore this email.`,
  });
  return !error;
}
