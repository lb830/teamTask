import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/env";
import type { AccountRole, Team } from "@/lib/database.types";
import { collectPages } from "@/lib/collect-pages";

export const isAdminRole = (role: AccountRole) =>
  role === "admin" || role === "superuser";
export const requireAccount = cache(async () => {
  if (!isConfigured()) redirect("/setup");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !profile)
    throw new Error(
      "Your account profile is unavailable. Ask your administrator to check database setup.",
    );
  if (profile.suspended)
    redirect("/login?error=This%20account%20has%20been%20suspended.");
  return { supabase, user, profile };
});
export async function requireAdmin() {
  const account = await requireAccount();
  if (!isAdminRole(account.profile.role)) notFound();
  return account;
}
export async function requireSuperuser() {
  const account = await requireAccount();
  if (account.profile.role !== "superuser") notFound();
  return account;
}
export const requireTeam = cache(async (slug: string) => {
  const account = await requireAccount();
  const { data: team } = await account.supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!team) notFound();
  const { data: membership } = await account.supabase
    .from("team_members")
    .select("team_id")
    .eq("team_id", team.id)
    .eq("user_id", account.user.id)
    .maybeSingle();
  if (!membership) notFound();
  return { ...account, team };
});
export const accountTeams = cache(async () => {
  const { supabase, user } = await requireAccount();
  const memberships = await collectPages((from, to) =>
    supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .order("team_id")
      .range(from, to),
  );
  const teams: Team[] = [];
  for (let index = 0; index < memberships.length; index += 100) {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .in(
        "id",
        memberships.slice(index, index + 100).map((member) => member.team_id),
      );
    if (error) throw new Error("Could not load your teams.");
    teams.push(...(data ?? []));
  }
  return teams.sort((left, right) => left.name.localeCompare(right.name));
});
