# Capability Map: teamTask

| Module id | Responsibility | Depends on |
|---|---|---|
| `platform` | Next.js and TypeScript foundation, Vercel deployment configuration, Supabase setup and access policies | — |
| `identity` | Supabase Auth, invite-only accounts, password flows, Resend email, environment-provisioned superuser | `platform` |
| `teams` | Teams, memberships, global roles, admin promotion, team creation, invitations, membership-based access | `identity` |
| `wiki` | Markdown pages scoped to a team | `teams` |
| `todos` | Private account-wide todos and team-visible todos | `teams` |
| `vault` | Team project folders, standalone files, uploads and downloads | `teams` |
| `pin-wall` | Team announcements and reactions | `teams` |
| `ai-assistant` | Disabled AI entry point; provider integration is deferred | `teams`, `vault` |

Build order: `platform` → `identity` → `teams` → `wiki`, `todos`, `vault`, and `pin-wall`. The disabled `ai-assistant` entry point follows the team and vault foundations.

## Shared boundaries

- There is no team chatroom.
- Membership in a team is required to access that team's content, including for global admins and the superuser.
- Removing a membership ends access immediately. Team-owned content remains with the team.
- The first superuser is provisioned from deployment environment variables. The superuser invites and promotes the first global admin; that admin creates the first team.
- AI remains disabled until a provider is selected. No provider integration is part of this build.
