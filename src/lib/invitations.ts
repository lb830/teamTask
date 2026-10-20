import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function newToken() {
  return randomBytes(32).toString("hex");
}
export async function lookupInvitation(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invitations")
    .select("*")
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) return null;
  const { data: sender } = await admin
    .from("profiles")
    .select("role,suspended")
    .eq("id", data.invited_by ?? "")
    .maybeSingle();
  if (
    !sender ||
    sender.suspended ||
    (data.kind === "admin"
      ? sender.role !== "superuser"
      : sender.role === "member")
  )
    return null;
  return data;
}
