"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CheckSquare,
  FolderClosed,
  Pin,
  Sparkles,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import type { Profile, Team } from "@/lib/database.types";
import { signOut } from "@/app/actions/auth";

export function Navigation({
  teams,
  profile,
}: {
  teams: Team[];
  profile: Profile;
}) {
  const path = usePathname();
  const router = useRouter();
  const slug = path.startsWith("/t/") ? path.split("/")[2] : null;
  const team = teams.find((team) => team.slug === slug);
  const activeTeam = team ?? teams[0];
  const base = activeTeam ? `/t/${activeTeam.slug}` : null;
  const links = [
    { label: "Wiki", href: base ? `${base}/wiki` : "/home", icon: BookOpen },
    { label: "My todos", href: "/todos", icon: CheckSquare },
    ...(base
      ? [
          { label: "Team todos", href: `${base}/todos`, icon: CheckSquare },
          { label: "Vault", href: `${base}/vault`, icon: FolderClosed },
          { label: "Pin wall", href: `${base}/wall`, icon: Pin },
        ]
      : []),
  ];
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-icon">
          t<span>↗</span>
        </span>
        teamTask<span className="brand-dot">.</span>
      </Link>
      <div className="workspace-select">
        <label htmlFor="team-switcher">YOUR WORKSPACE</label>
        {teams.length ? (
          <select
            id="team-switcher"
            aria-label="Switch team"
            value={activeTeam?.slug ?? ""}
            onChange={(e) => router.push(`/t/${e.target.value}/wiki`)}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="muted">No teams yet</span>
        )}
      </div>
      <nav aria-label="Workspace" className="nav-list">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={`nav-link ${path === href || (href.endsWith("/wiki") && path.startsWith(`${href}/`)) ? "active" : ""}`}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
        {base && (
          <Link
            href={`${base}/ai`}
            className={`nav-link ${path.endsWith("/ai") ? "active" : ""}`}
          >
            <Sparkles size={19} />
            AI assistant<span className="mini-badge">Soon</span>
          </Link>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="status-dot" /> A little more organized.
          <br />
          <span className="muted">A lot more together.</span>
        </div>
        {profile.role !== "member" && (
          <Link
            className={`nav-link ${path.startsWith("/admin") ? "active" : ""}`}
            href="/admin"
          >
            <Shield size={18} />
            Administration
            <ArrowUpRight size={15} />
          </Link>
        )}
        <div className="account">
          <span className="avatar">
            {(profile.display_name || profile.email).slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>
              {profile.display_name || profile.email.split("@")[0]}
            </strong>
            <small>{profile.role}</small>
          </div>
          <form action={signOut}>
            <button className="text-button" title="Sign out">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
