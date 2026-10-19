# Manual review scenarios

These scenarios were supplied or derived from the repository acceptance criteria. They have not been executed against live services in this session. No automated suite is included.

Use a separate development Supabase project, a verified Resend sender, and accounts for a superuser, two global admins, and two members. Never use production data for the review.

## Foundation and identity

1. Start without Supabase environment values. Open `/`, `/login`, and a guessed team route. Confirm the setup-required state and absence of team data. Inspect desktop and narrow mobile layouts, keyboard focus, and the skip-to-content link.
2. Configure Supabase, apply the migration, disable public signup, and rebuild. Confirm signed-out workspace requests redirect to sign-in. Attempt public Auth signup directly and confirm the hosted service rejects it.
3. Run bootstrap for the owner, repeat it, then attempt it with a different email. Only the first account should become superuser; rerunning must not reset its password or replace it.
4. Sign in, sign out, allow a session to expire/refresh, and follow a password recovery email in the requesting browser. Verify invalid/expired callback links and wrong passwords produce useful feedback.
5. Invite an admin through Resend. Accept as a new account with a password. Reuse that token, then try separately expired and revoked tokens; none should grant access. Resend another invite and verify only the latest link works. Simulate delivery failure and retry it from administration.
6. Invite an existing account to a second team. Acceptance must use its existing password or matching active session, without resetting credentials or creating a duplicate account. Try accepting while signed in as the wrong email.
7. Promote/demote an admin and suspend/restore an account. Only the superuser can do so. Global role changes must not create team memberships. A suspended user's existing session must not access content.

## Teams and access

1. Create two teams as an admin; confirm each creator is automatically a member and the switcher opens that team's wiki first. A regular member must not create a team.
2. Invite different members to each team. Verify direct routes and REST queries as a member, a non-member, an admin non-member, and the superuser non-member. Only members can read content. Admins may still manage team metadata and membership from `/admin`.
3. Remove a member while their browser remains signed in. Repeat reads/writes and Storage requests with the existing session. New requests must be denied while existing team content remains. Already downloaded/displayed content cannot be withdrawn.
4. Attempt to change `team_id`, `created_by`, and protected account roles directly through REST. Column grants/policies must reject those mutations.

## Wiki and todos

1. Create a wiki page; preview headings, lists, code, tables, links, and a raw HTML snippet. Saving publishes immediately. HTML must not execute; remote images should become explicit links.
2. Edit the page as another member. Only the author while a member or an admin member can delete it. Confirm a non-member who knows the URL cannot read it.
3. Create/edit/complete/delete private todos. Switch teams and confirm the list stays the same. Other members, admins, and the superuser must not read those todos through the UI or REST.
4. Create team todos with and without due dates. Have a second member change all three statuses and edit titles. Only the creator while a member or an admin member may delete. Invalid dates and overlong titles must be rejected.
5. Add enough records to use pagination and verify wiki title search and pagination preserve the query.

## Vault

1. Create project folders; upload supported standalone and project files. Review ZIP, PDF, DOC/DOCX, Markdown/text, CSV, and representative source-code extensions. ZIPs must remain intact downloads.
2. Try an empty file, an unsupported extension, exactly 104,857,600 bytes, and a file one byte larger. Review both app validation and the private bucket's enforced limit, including direct Storage requests.
3. Interrupt the network during a large transfer and reconnect. Review resumable retries/progress. Reopen the vault and finish a fully uploaded pending object or clear an interrupted one.
4. Download as another member. Attempt listing/downloads as a non-member and an admin/superuser non-member. Remove the uploader's membership and try a fresh authenticated request with the old session. Public Storage URLs must not return file content.
5. Attempt uploading under another team's path or into a folder from another team; policies and the composite FK must reject it. Attempt finalization of a file whose stored size does not match metadata.

## Pin wall and disabled AI

1. Publish/edit/delete an announcement as an admin member. Try the same as a regular member and an admin non-member; both must fail.
2. Add and remove each reaction as members. Counts and selected states should update; nobody can remove someone else's reaction. There are no comments or threads.
3. Open the disabled AI entry point as a member. Confirm the unavailable state, disabled controls, and absence of provider requests, indexing, or conversation storage.

## Production handoff

Compare `.env.example`, the README, deployed environment variables, Auth redirect allowlists, SMTP, Resend verification, and the private bucket settings. Run the development-project scenarios before opening the production workspace. Confirm the Git branch contains the app, migration, and documentation, with no credentials, `.agents/`, or local skill lockfile.
