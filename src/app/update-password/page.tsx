import { redirect } from "next/navigation";
import { isConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/auth-card";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { updatePassword } from "@/app/actions/auth";
export default async function UpdatePassword() {
  if (!isConfigured()) redirect("/setup");
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect("/reset-password");
  return (
    <AuthCard
      title="A fresh password."
      description="Choose a password of at least 12 characters."
    >
      <ActionForm action={updatePassword} className="stack">
        <label>
          New password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            name="confirm"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <SubmitButton>Save password</SubmitButton>
      </ActionForm>
    </AuthCard>
  );
}
