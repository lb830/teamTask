# Implementation status

Updated 20 October 2026 (Europe/Berlin).

The user authorized building the repository plan without further questions and documenting unclear or unavailable work. The checkout initially contained only the README; fetching and fast-forwarding to `origin/main` recovered all eight capability specifications, the capability map, and the 15-task implementation plan. Those documents define this build.

## Implemented

Tasks 01–14 are implemented: Next.js/TypeScript foundation, responsive wiki-first shell, setup-required state, Supabase schema/clients and row policies, password authentication/recovery, idempotent superuser bootstrap, Resend invitations, global account roles/suspension, teams/membership management, Markdown wiki, private and team todos, private vault with resumable uploads, admin pin wall with reactions, and the disabled AI view.

Task 15 supplies the environment template, deployment guide, private-storage setup, bootstrap instructions, manual review scenarios, and Git handoff to the `work` branch. Local development skills and credentials are excluded from Git.

## Completed checks

- Dependency installation completed and `package-lock.json` records exact versions.
- `npm run typecheck` passed with strict TypeScript.
- `npm run lint` passed.
- `npm run build` produced the production Next.js application and all planned routes.
- PostgreSQL syntax parsing accepted all 106 migration statements; no hosted database execution is implied.
- `npm run dev` started successfully on port 3000.
- Local HTTP requests reached the setup page and the root/login/team route handlers without a configured backend; setup redirects are emitted through Next.js rendering.
- Running bootstrap without credentials refused to proceed with a configuration message; no account was created.
- Source review covered every RLS policy, privileged RPC, server action, immutable ownership/scope grant, and Storage path policy. See `access-review.md`.
- No automated tests were added or run, following `SPEC-platform.md` and `tasks/plan.md`.

## Skipped work and reasons

| Item                                                                                    | Reason                                                                                                           | What remains                                                                     |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Hosted Supabase provisioning and migration execution                                    | No Supabase project or credentials were provided.                                                                | Configure a project and apply the migration in the README.                       |
| Live sign-in, recovery email, invitations, role flows, and membership-removal scenarios | These require configured Supabase and Resend services and test accounts.                                         | Follow `manual-review.md` against a development project.                         |
| Actual 100 MB upload/download and resumable-transfer review                             | No private Storage backend was available.                                                                        | Configure the project limit and private bucket, then follow the vault scenarios. |
| Resend sender verification and email delivery                                           | No API key or verified sender domain was provided.                                                               | Verify the sender and configure invitation delivery plus Supabase recovery SMTP. |
| Initial production superuser                                                            | No owner credentials or target Supabase project were provided.                                                   | Run `npm run bootstrap` from a trusted environment after setup.                  |
| Vercel deployment and domain setup                                                      | No deployment target or production credentials were provided; the plan explicitly defers deployment until setup. | Import the repository, configure environment values, and deploy.                 |
| Visual desktop/mobile browser review                                                    | No callable browser-control tool was available in this session.                                                  | Inspect the responsive layouts in a connected browser after starting the app.    |
| AI provider integration, indexing, and conversations                                    | Explicitly deferred by `SPEC-ai-assistant.md`; no provider is selected.                                          | Separate future implementation. The current entry point is visibly disabled.     |

## Implementation choices

- Next.js 16 uses `src/proxy.ts` for session refresh in place of the plan's illustrative `middleware.ts` filename.
- Plain CSS implements the responsive interface; a PostCSS dependency is unnecessary.
- Account/team administration lives outside team-content routes so an admin can manage membership without joining or seeing content.
- The vault uses authenticated downloads instead of signed URLs, so subsequent requests evaluate current membership.
- Source-code extensions are explicitly allowlisted in TypeScript and SQL. Files are not inspected for malware, executed, unpacked, or indexed.
- Wiki editing publishes immediately and uses the most recent save; revision history and concurrent editing were not specified.
- Backend-dependent acceptance checks are documented as pending, not claimed as tested. The task checkboxes record implementation coverage.
