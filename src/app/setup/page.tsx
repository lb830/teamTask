import {
  BookOpen,
  CheckSquare,
  FolderClosed,
  Pin,
  ArrowUpRight,
  LockKeyhole,
} from "lucide-react";
export default function Setup() {
  return (
    <div className="setup-shell">
      <aside className="sidebar setup-sidebar">
        <div className="brand">
          <span className="brand-icon">
            t<span>↗</span>
          </span>
          teamTask<span className="brand-dot">.</span>
        </div>
        <div className="workspace-select">
          <span className="eyebrow">YOUR WORKSPACE</span>
          <strong>Let’s make room.</strong>
        </div>
        <nav aria-label="Workspace preview" className="nav-list">
          {[
            [BookOpen, "Wiki"],
            [CheckSquare, "My todos"],
            [CheckSquare, "Team todos"],
            [FolderClosed, "Vault"],
            [Pin, "Pin wall"],
          ].map(([Icon, label], i) => {
            const Glyph = Icon as typeof BookOpen;
            return (
              <span
                className={`nav-link ${i === 0 ? "active" : ""}`}
                key={String(label)}
              >
                <Glyph size={19} />
                {String(label)}
              </span>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            A little more organized.
            <br />
            <span className="muted">A lot more together.</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span>A shared place for good work.</span>
          <span className="privacy-label">
            <LockKeyhole size={14} />
            Private by design
          </span>
        </div>
        <main id="main" className="main-content setup-main">
          <p className="eyebrow">WELCOME TO TEAMTASK</p>
          <h1>
            Good work starts
            <br />
            with a shared space<span className="accent">.</span>
          </h1>
          <p className="setup-lead">
            The knowledge you keep. The things you’re doing.
            <br />
            The files that move it all forward. Together, at last.
          </p>
          <div className="setup-banner">
            <span className="setup-number">01</span>
            <div>
              <h2>Connect your workspace</h2>
              <p>
                Set up Supabase to turn this space into your team’s home. Your
                workspace stays private until setup is complete.
              </p>
            </div>
            <ArrowUpRight size={28} />
          </div>
          <div className="setup-grid">
            <article className="panel">
              <BookOpen size={24} />
              <h3>A shared memory</h3>
              <p>
                Give your team’s knowledge a home with a simple Markdown wiki.
              </p>
            </article>
            <article className="panel">
              <CheckSquare size={24} />
              <h3>Progress, together</h3>
              <p>
                Keep personal focus and team priorities in their own spaces.
              </p>
            </article>
            <article className="panel">
              <FolderClosed size={24} />
              <h3>Everything in place</h3>
              <p>
                Bring project files and important updates closer to the work.
              </p>
            </article>
          </div>
          <details className="setup-details">
            <summary>Administrator setup instructions</summary>
            <ol>
              <li>
                Create a Supabase project and apply{" "}
                <code>supabase/migrations/0001_core.sql</code>.
              </li>
              <li>
                Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> from the
                project settings.
              </li>
              <li>
                Configure server-only credentials, Resend, and the app URL using{" "}
                <code>.env.example</code>.
              </li>
              <li>
                Run <code>npm run bootstrap</code> to provision the first
                superuser. See the repository README for the full deployment
                guide.
              </li>
            </ol>
          </details>
          <p className="setup-footnote">
            <LockKeyhole size={14} />
            Invite-only access. Private files. Your team’s space.
          </p>
        </main>
      </div>
    </div>
  );
}
