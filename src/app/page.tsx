import { redirect } from "next/navigation";
import { accountTeams } from "@/lib/authz/access";
import { isConfigured } from "@/lib/supabase/env";
export default async function Page() {
  if (!isConfigured()) redirect("/setup");
  const teams = await accountTeams();
  redirect(teams[0] ? `/t/${teams[0].slug}/wiki` : "/home");
}
