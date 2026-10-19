import Link from "next/link";
import { requireAccount, isAdminRole } from "@/lib/authz/access";
import { PageHeader } from "@/components/ui/page-header";
export default async function Home() {
  const { profile } = await requireAccount();
  return (
    <>
      <PageHeader
        eyebrow="A fresh start"
        title={`Welcome, ${profile.display_name || profile.email.split("@")[0]}.`}
        description="Your next chapter of teamwork starts here."
      />
      <div className="panel welcome-panel">
        <div className="large-glyph">↗</div>
        <h2>A place to bring it all together.</h2>
        <p className="muted">
          Your team’s knowledge, tasks, files, and updates will live here.
          Accept an invitation to join a team.
        </p>
        <div className="button-row">
          {isAdminRole(profile.role) && (
            <Link className="button" href="/teams/new">
              Create a team
            </Link>
          )}
          {profile.role === "superuser" && (
            <Link className="button secondary" href="/admin">
              Invite your first admin
            </Link>
          )}
          <Link className="button secondary" href="/todos">
            Open my private todos
          </Link>
        </div>
      </div>
    </>
  );
}
