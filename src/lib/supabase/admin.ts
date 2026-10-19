import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "./env";
// Limited to invitation account provisioning and token lookup. Content uses user-scoped clients.
export function createAdminClient() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret)
    throw new Error("Invitation provisioning has not been configured.");
  return createClient<Database>(publicEnv().url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
