import Link from "next/link";
import { requireAdmin } from "@/lib/authz/access";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { InviteForm, InvitationList } from "@/components/admin/invitations";
import { changeRole, suspendAccount } from "@/app/actions/teams";
import { pageNumber, pageRange } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    accounts?: string;
    invitations?: string;
  }>;
}) {
  const { supabase, profile } = await requireAdmin();
  const query = await searchParams;
  const page = pageNumber(query.page),
    accountPage = pageNumber(query.accounts),
    invitePage = pageNumber(query.invitations);
  const [teamsResult, accountsResult, invitesResult] = await Promise.all([
    supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(...pageRange(page)),
    profile.role === "superuser"
      ? supabase
          .from("profiles")
          .select("*")
          .order("created_at")
          .order("id")
          .range(...pageRange(accountPage))
      : Promise.resolve({ data: [], error: null }),
    profile.role === "superuser"
      ? supabase
          .from("invitations")
          .select("*")
          .eq("kind", "admin")
          .order("created_at", { ascending: false })
          .order("id")
          .range(...pageRange(invitePage))
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (teamsResult.error || accountsResult.error || invitesResult.error)
    throw new Error("Could not load administration data.");
  const teams = teamsResult.data ?? [],
    profiles = accountsResult.data ?? [],
    invitations = invitesResult.data ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Look after your workspace."
        description="Manage teams and invitations. Team content is available only to that team’s members."
      >
        <Link href="/teams/new" className="button">
          ＋ Create team
        </Link>
      </PageHeader>
      <div className="section-heading">
        <h2>Teams</h2>
      </div>
      {teams.length ? (
        <div className="panel">
          {teams.map((team) => (
            <div key={team.id} className="list-row">
              <div>
                <h3>{team.name}</h3>
                <p className="muted">/{team.slug}</p>
              </div>
              <Link
                className="button secondary small"
                href={`/admin/teams/${team.id}`}
              >
                Manage members →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Your first team starts here.">
          Create a team to give people a shared place to work.
        </EmptyState>
      )}
      <Pagination page={page} count={teams.length} base="/admin" />
      {profile.role === "superuser" && (
        <>
          <div className="section-heading">
            <h2>Global administrators</h2>
          </div>
          <div className="management-grid">
            <div className="panel">
              <h3>Invite an administrator</h3>
              <p className="muted small">
                Admins create teams and manage memberships. They join teams by
                invitation or by creating a team.
              </p>
              <InviteForm />
            </div>
            <div className="panel">
              <h3>Admin invitations</h3>
              <InvitationList invitations={invitations} />
              <Pagination
                page={invitePage}
                count={invitations.length}
                base="/admin"
                parameter="invitations"
              />
            </div>
          </div>
          <div className="section-heading">
            <h2>Accounts</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Role</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <strong>
                        {person.display_name || person.email.split("@")[0]}
                      </strong>
                      <br />
                      <span className="small muted">{person.email}</span>
                    </td>
                    <td>
                      {person.role === "superuser" ? (
                        <span className="tag">Superuser</span>
                      ) : (
                        <ActionForm
                          action={changeRole}
                          className="table-actions"
                        >
                          <input
                            name="user_id"
                            value={person.id}
                            type="hidden"
                          />
                          <select
                            aria-label={`Role for ${person.email}`}
                            name="role"
                            defaultValue={person.role}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <SubmitButton className="button secondary small">
                            Save role
                          </SubmitButton>
                        </ActionForm>
                      )}
                    </td>
                    <td>
                      {person.role === "superuser" ? (
                        "Active"
                      ) : (
                        <ActionForm action={suspendAccount}>
                          <input
                            name="user_id"
                            value={person.id}
                            type="hidden"
                          />
                          <input
                            name="suspended"
                            value={String(!person.suspended)}
                            type="hidden"
                          />
                          <SubmitButton
                            className={`button ${person.suspended ? "secondary" : "danger"} small`}
                          >
                            {person.suspended
                              ? "Restore access"
                              : "Suspend account"}
                          </SubmitButton>
                        </ActionForm>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={accountPage}
            count={profiles.length}
            base="/admin"
            parameter="accounts"
          />
        </>
      )}
    </>
  );
}
