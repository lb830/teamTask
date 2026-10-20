"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/env";
import { appUrl } from "@/lib/config";
import {
  emailSchema,
  field,
  rawField,
  passwordSchema,
  safeNext,
  type ActionState,
} from "@/lib/forms";

export async function signIn(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isConfigured())
    return { error: "The workspace needs to be configured first." };
  const email = emailSchema.safeParse(field(form, "email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: rawField(form, "password"),
  });
  if (error)
    return { error: "We couldn’t sign you in. Check your email and password." };
  revalidatePath("/", "layout");
  redirect(safeNext(field(form, "next")));
}
export async function signOut() {
  if (isConfigured()) await (await createClient()).auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
export async function requestReset(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isConfigured())
    return { error: "The workspace needs to be configured first." };
  const email = emailSchema.safeParse(field(form, "email"));
  if (!email.success) return { error: "Enter a valid email address." };
  let origin: string;
  try {
    origin = appUrl();
  } catch {
    return {
      error:
        "Password recovery has not been configured. Contact your administrator.",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });
  if (error)
    return {
      error:
        "Password recovery is unavailable right now. Please try again later.",
    };
  return {
    success:
      "If this email belongs to an account, a password reset link is on its way. Open it in this browser.",
  };
}
export async function updatePassword(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = passwordSchema.safeParse(rawField(form, "password"));
  if (!parsed.success)
    return { error: "Use a password between 12 and 128 characters." };
  if (parsed.data !== rawField(form, "confirm"))
    return { error: "Your passwords do not match." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "This reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error)
    return {
      error:
        "Could not update your password. Request a fresh reset link and try a different password.",
    };
  redirect("/");
}
