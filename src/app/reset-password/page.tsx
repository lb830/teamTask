import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { requestReset } from "@/app/actions/auth";
export default function ResetPassword() {
  return (
    <AuthCard
      title="Let’s get you back in."
      description="We’ll email you a link to reset your password."
    >
      <ActionForm action={requestReset} className="stack">
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <SubmitButton>Send reset link</SubmitButton>
      </ActionForm>
      <Link className="inline-link" href="/login">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
