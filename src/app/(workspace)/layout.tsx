import { accountTeams, requireAccount } from "@/lib/authz/access";
import { Navigation } from "@/components/workspace/navigation";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAccount();
  const teams = await accountTeams();
  return (
    <div className="app-shell">
      <Navigation teams={teams} profile={profile} />
      <div className="workspace">
        <div className="topbar">
          <span>A shared place for good work.</span>
          <span className="privacy-label">
            <span className="status-dot" />
            Private workspace
          </span>
        </div>
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="workspace-footer">
          Made for your team. Room for your ideas.
        </footer>
      </div>
    </div>
  );
}
