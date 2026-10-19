import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { acceptInvitation } from "@/app/actions/invitations";
import { lookupInvitation } from "@/lib/invitations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let invitation;
  try {
    invitation = await lookupInvitation(token);
  } catch {
    return (
      <AuthCard
        title="Invitations are unavailable."
        description="Ask your administrator to finish configuring invitations."
      >
        <Link className="button secondary" href="/login">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }
  if (!invitation)
    return (
      <AuthCard
        title="This link is no longer available."
        description="It may have expired, been revoked, or already been used. Ask your administrator for a new invitation."
      >
        <Link className="button secondary" href="/login">
          Go to sign in
        </Link>
      </AuthCard>
    );
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  const matches = user?.email?.toLowerCase() === invitation.email.toLowerCase();
  const { data: existing } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("email", invitation.email.toLowerCase())
    .maybeSingle();
  return (
    <AuthCard
      title="You’re invited."
      description={`${invitation.email} has been invited ${invitation.kind === "admin" ? "to become a global administrator" : "to join a team"}.`}
    >
      <ActionForm action={acceptInvitation} className="stack">
        <input name="token" value={token} type="hidden" />
        {!matches && (
          <>
            {!existing && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </label>
            )}
            <label>
              {existing ? "Your existing password" : "Create a password"}
              <input
                name="password"
                type="password"
                autoComplete={existing ? "current-password" : "new-password"}
                minLength={existing ? undefined : 12}
                maxLength={128}
                required
              />
            </label>
            {!existing && (
              <label>
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
            )}
          </>
        )}
        <SubmitButton pendingLabel="Joining…">Accept invitation</SubmitButton>
      </ActionForm>
      {existing && !matches && (
        <Link className="inline-link" href="/reset-password">
          Reset your existing password
        </Link>
      )}
      <p className="small muted">
        Your invitation can be used once and expires after seven days.
      </p>
    </AuthCard>
  );
}
