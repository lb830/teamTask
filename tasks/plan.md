# Implementation Plan: teamTask

Implementation status and documented skips: [`../docs/implementation-status.md`](../docs/implementation-status.md). The user authorized execution of this plan; live deployment awaits the documented service setup.

## Overview

Build the approved team workspace as a Next.js and TypeScript app for Vercel. Supabase provides authentication, Postgres, and private file storage; Resend sends invitations. The app includes a Markdown wiki, personal and team todos, a team vault, and an admin pin wall. AI is a disabled entry point only until a provider is selected. There is no team chatroom.

The repository currently has no application code or configured service credentials. The implementation will include deployment configuration and setup instructions; a live deployment requires the owner's Supabase and Resend configuration.

## Architecture decisions

- Store global account roles separately from team membership. A global admin can manage teams and invitations, but all team content queries and storage access still require membership in that team.
- Enforce access in server-side handlers and Supabase row-level policies. Check current membership so removing a member ends access immediately, even when an existing session remains active.
- Store private todos against the account with no team id. Store public todos, wiki pages, vault items, and pin-wall posts against a team.
- Keep the Supabase Storage bucket private. Use team-scoped paths and policies for upload, listing, and download. Cap each item at 100 MB.
- Track invitation state in Postgres. Invitation tokens are single-use, expire after seven days, and can be revoked or resent by an admin. Send invitation messages with Resend; use Supabase Auth for passwords, sessions, and password resets.
- Provision the initial superuser from deployment environment variables. That account invites and promotes the first global admin; the admin creates the first team and is added to it automatically.
- Do not implement a provider adapter, prompt storage, or file indexing for AI in this build. ZIP archives remain downloadable and are excluded from future indexing.
- Use manual, scenario-based review for the listed acceptance criteria. No automated tests will be added or run unless the user asks for testing or verification.

## Dependency graph

```text
01 App scaffold
  └─ 02 Workspace shell
  └─ 03 Supabase clients + schema + row-level policies
       └─ 04 Sign-in and password reset
            └─ 05 Superuser bootstrap + invitation acceptance/email
                 └─ 06 Global admin role management
                      └─ 07 Team creation and switching
                           └─ 08 Team invitations and membership management
                                ├─ 09 Wiki
                                ├─ 11 Team todos
                                ├─ 12 Vault
                                └─ 13 Pin wall
       └─ 10 Private account-wide todos
       └─ 14 Disabled AI entry point (also depends on 12 Vault)
15 Deployment guide and GitHub push follows the feature work.
```

## Task list

The ordered task breakdown, acceptance criteria, manual verification steps, and file estimates are in [`todo.md`](todo.md).

### Checkpoint: Foundation

After Tasks 01–04, review the application shell, configured and unconfigured setup states, auth routing, and the SQL membership policies.

### Checkpoint: Identity and teams

After Tasks 05–08, manually walk through the initial superuser, global-admin invitation/promotion, team creation, member invitation, and member removal flows with configured development services.

### Checkpoint: Team capabilities

After Tasks 09–14, manually review each feature as a member and as a non-member. Confirm private todos remain account-only, team content is inaccessible without membership, and the AI area makes no provider requests.

### Checkpoint: Handoff

After Task 15, review the environment guide, migration order, private-bucket configuration, and the GitHub branch contents. Do not deploy until the owner configures credentials and a verified Resend sender.

## Risks and mitigations

| Risk                                                                                | Impact | Mitigation                                                                                                             |
| ----------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| A role check accidentally grants a global admin or superuser access to team content | High   | Keep role management separate from membership checks; inspect each RLS policy against member and non-member scenarios. |
| Membership removal leaves access through cached session claims or signed file links | High   | Query current membership in policies and server handlers; use short-lived signed download URLs.                        |
| Supabase Auth links and Resend invitations are configured inconsistently            | Medium | Persist invitation expiry/use state in Postgres and document the required redirect and sender settings.                |
| 100 MB uploads exceed a Supabase project limit or time out                          | Medium | Document the storage project limit and use resumable/direct-to-storage uploads for large items.                        |
| No production credentials are present in this repository                            | Medium | Include an environment template and setup guide; show a setup-required state instead of weakening authentication.      |
| No AI provider has been selected                                                    | Low    | Keep the AI link disabled and defer provider-specific retrieval and conversation storage.                              |

## Open questions

None for the approved scope. Supabase and Resend credentials, sender-domain verification, and an AI provider selection are setup prerequisites or future decisions, not blockers for writing the application.
