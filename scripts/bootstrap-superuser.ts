import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";
async function bootstrap() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.BOOTSTRAP_SUPERUSER_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_SUPERUSER_PASSWORD;
  if (!url || !key || !email)
    throw new Error(
      "Set the Supabase URL, service key, and BOOTSTRAP_SUPERUSER_EMAIL.",
    );
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: state, error: stateError } = await supabase
    .from("bootstrap_state")
    .select("user_id")
    .eq("singleton", true)
    .maybeSingle();
  if (stateError)
    throw new Error(
      "Could not read bootstrap state. Apply the database migration first.",
    );
  if (state) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", state.user_id)
      .single();
    if (owner?.email !== email)
      throw new Error(
        "A different superuser is already configured; no changes made.",
      );
    console.log(
      "Superuser is already configured. No account or password changes made.",
    );
    return;
  }
  if (!password || password.length < 12 || password.length > 128)
    throw new Error("Set a bootstrap password between 12 and 128 characters.");
  // Never take over or reset an existing account by matching its email.
  const { data: existing, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) throw new Error("Could not inspect existing accounts.");
  if (existing)
    throw new Error(
      "This email already belongs to an account. Bootstrap will not modify it. See the setup guide for recovery.",
    );
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: process.env.BOOTSTRAP_SUPERUSER_NAME || "Workspace owner",
    },
  });
  if (error || !data.user)
    throw new Error(
      "Could not create the bootstrap account. Check Auth configuration and password policy.",
    );
  const { error: roleError } = await supabase.rpc("bootstrap_superuser", {
    target_user: data.user.id,
  });
  if (roleError)
    throw new Error(
      "The account was created but bootstrap did not complete. No existing superuser was replaced. Follow the recovery instructions.",
    );
  console.log(
    "Superuser configured. Remove the bootstrap password from your environment, then sign in.",
  );
}
bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Bootstrap failed.");
  process.exitCode = 1;
});
