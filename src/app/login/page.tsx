import Link from "next/link";
import { redirect } from "next/navigation";
import { isConfigured } from "@/lib/supabase/env";
import { AuthCard } from "@/components/auth/auth-card";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { signIn } from "@/app/actions/auth";
import { safeNext } from "@/lib/forms";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  if (!isConfigured()) redirect("/setup");
  const query = await searchParams;
  return (
    <AuthCard
      title="Welcome back."
      description="Sign in to pick up where your team left off."
    >
      {query.error && (
        <p className="notice error" role="alert">
          {query.error}
        </p>
      )}
      <ActionForm action={signIn} className="stack">
        <input type="hidden" name="next" value={safeNext(query.next)} />
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </ActionForm>
      <Link className="inline-link" href="/reset-password">
        Forgot your password?
      </Link>
      <p className="small muted">
        New here? Ask your administrator for an invitation.
      </p>
    </AuthCard>
  );
}
