import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authz/access";
import { uuid } from "@/lib/forms";
import { PageHeader } from "@/components/ui/page-header";
import { InviteForm, InvitationList } from "@/components/admin/invitations";
import { ActionForm, DeleteButton } from "@/components/ui/action-form";
import { removeMember } from "@/app/actions/teams";
import { pageNumber, pageRange } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
export default async function ManageTeam({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ page?: string; invitations?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { teamId } = await params;
  if (!uuid.safeParse(teamId).success) notFound();
  const query = await searchParams;
  const page = pageNumber(query.page),
    invitePage = pageNumber(query.invitations);
  const [teamResult, membersResult, invitesResult] = await Promise.all([
    supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
    supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .order("joined_at")
      .order("user_id")
      .range(...pageRange(page)),
    supabase
      .from("invitations")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .order("id")
      .range(...pageRange(invitePage)),
  ]);
  if (!teamResult.data) notFound();
  if (membersResult.error || invitesResult.error)
    throw new Error("Could not load team administration data.");
  const members = membersResult.data ?? [];
  const { data: profiles, error } = members.length
    ? await supabase
        .from("profiles")
        .select("*")
        .in(
          "id",
          members.map((member) => member.user_id),
        )
    : { data: [], error: null };
  if (error) throw new Error("Could not load member accounts.");
  const base = `/admin/teams/${teamId}`;
  return (
    <>
      <div className="breadcrumbs">
        <Link href="/admin">Administration</Link>
        <span>/</span>
        <span>Members</span>
      </div>
      <PageHeader
        eyebrow="Team administration"
        title={teamResult.data.name}
        description="Manage who belongs to this team. Removing a member leaves their team content intact."
      />
      <div className="management-grid">
        <div className="panel">
          <h2>Invite a teammate</h2>
          <InviteForm teamId={teamId} />
        </div>
        <div className="panel">
          <h2>Invitations</h2>
          <InvitationList invitations={invitesResult.data ?? []} />
          <Pagination
            page={invitePage}
            count={invitesResult.data?.length ?? 0}
            base={base}
            parameter="invitations"
          />
        </div>
      </div>
      <div className="section-heading">
        <h2>Members</h2>
      </div>
      <div className="panel">
        {members.length ? (
          members.map((member) => {
            const person = profiles?.find((p) => p.id === member.user_id);
            return (
              <div className="list-row" key={member.user_id}>
                <div>
                  <strong>
                    {person?.display_name || person?.email || "Team member"}
                  </strong>
                  <p className="muted">{person?.email}</p>
                </div>
                <ActionForm action={removeMember}>
                  <input name="team_id" value={teamId} type="hidden" />
                  <input name="user_id" value={member.user_id} type="hidden" />
                  <DeleteButton
                    label="Remove member"
                    message="Remove this member’s access to the team? Their team content will remain."
                  />
                </ActionForm>
              </div>
            );
          })
        ) : (
          <p className="muted">No members on this page.</p>
        )}
      </div>
      <Pagination page={page} count={members.length} base={base} />
    </>
  );
}
