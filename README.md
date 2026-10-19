# teamTask

A private team workspace built with Next.js, TypeScript, Supabase, and Resend. Each team has a Markdown wiki, shared todos, a private file vault, and an announcement wall. Personal todos stay private to their account across teams. AI is deliberately disabled; there is no chatroom or comment system.

## Run locally

Use Node.js 22.18+ (Node 24 recommended).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without Supabase environment values, the app displays a setup screen and does not expose workspace data. Configure services below before using accounts and team features.

```sh
npm run typecheck
npm run lint
npm run build
npm run start
```

No automated test suite was added or run, following the repository specification. See [implementation status](docs/implementation-status.md) for completed checks and skipped work, and [manual review scenarios](docs/manual-review.md) for the service-dependent acceptance review.

## Environment variables

Copy `.env.example` into `.env.local` for development. Configure deployment values in Vercel; never commit credentials. The two `NEXT_PUBLIC_` values are intentionally browser-visible. All other values are server-only.

| Variable                               | Purpose                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL.                                                                                                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project publishable key (the legacy anon key also works). Never put the service-role key here.                                               |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only Supabase service-role/secret key, used for invitation token lookup and invited account provisioning. Also required by bootstrap. |
| `APP_URL`                              | Canonical application origin, such as `https://teams.example.com`. Use `http://localhost:3000` locally. HTTPS is required outside localhost. |
| `RESEND_API_KEY`                       | Resend key permitted to send from the verified domain.                                                                                       |
| `RESEND_FROM`                          | Sender on that domain, e.g. `teamTask <invites@example.com>`.                                                                                |
| `BOOTSTRAP_SUPERUSER_EMAIL`            | First owner's email, used only by the bootstrap command.                                                                                     |
| `BOOTSTRAP_SUPERUSER_PASSWORD`         | Initial password, 12–128 characters. Remove from the environment after provisioning.                                                         |
| `BOOTSTRAP_SUPERUSER_NAME`             | Optional first owner's display name.                                                                                                         |

Public Supabase values are embedded during the Next.js build. Rebuild/redeploy after changing them. Configure `APP_URL` per environment; production invitations must not point at a preview URL.

## Supabase setup

1. Create a fresh Supabase project. Copy its URL, publishable key, and server secret into your environment.
2. Apply `supabase/migrations/0001_core.sql` once using the SQL editor, or use the Supabase CLI:

   ```sh
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

   This migration creates the complete schema, account trigger, membership functions, column grants, row-level policies, and the private `team-vault` bucket. It assumes Supabase's existing `auth` and `storage` schemas. Apply migrations in filename order. Use a separate Supabase project for development/preview; do not point a development environment at production data.

3. In **Authentication → Providers / Sign In**, leave email/password enabled and **disable new user signup**, anonymous sign-in, and unused external providers. Do this in the hosted dashboard as well: `supabase/config.toml` only configures local Supabase. Invited accounts are provisioned with the server-side Admin API, which works while public signup is disabled.
4. Set the Auth **Site URL** to `APP_URL`. Allow the exact callback URL `https://YOUR_APP/auth/callback` (and `http://localhost:3000/auth/callback` in the development project). Keep the password-recovery email template's Supabase `ConfirmationURL` link. Recovery uses PKCE; open the reset email in the browser that requested it.
5. Set the minimum password length to 12. Configure production SMTP for Supabase Auth password-recovery emails. Supabase's built-in sender is restricted and is not suitable for general production delivery. You may use Resend SMTP with the same verified sender domain; invitation emails use the Resend API separately.
6. In Storage settings, ensure the project-wide upload limit allows at least **104,857,600 bytes (100 MiB, labeled 100 MB in the UI)**. Some plans have a lower maximum, so choose an appropriate plan. The migration also enforces this maximum at the bucket level. Keep `team-vault` **private**, and do not add permissive policies or make public URLs for it. REST row limits should remain at least 500 (the included local config uses 1,000).
7. Do not manually create regular Auth users: users join through invitations. The migration's Auth trigger creates a profile automatically for each new Auth user. Roles are never read from editable user metadata.

The TypeScript database contract is in `src/lib/database.types.ts`. Keep it aligned with future migrations; no database schema was inferred from a live service during this build.

## Resend setup

Verify your sending domain in Resend, configure its DNS records, then set `RESEND_API_KEY` and `RESEND_FROM`. Sending to arbitrary invitees requires a verified domain, not Resend's sandbox sender.

Invitations use 256-bit random tokens. Only SHA-256 token hashes are stored in Postgres; raw tokens are sent in email links. Links expire after seven days and are redeemed atomically once. Resending rotates the token and expiration, invalidating the old link. Revoked invitations require a new invitation. Delivery failures appear in administration with a resend option.

Existing accounts accept while signed in as the invited email, or enter their existing password. New invitees set their name and password. Acceptance checks both the authenticated email and the current authority of the inviter. Demoting or suspending an inviter can invalidate their outstanding invitations.

## Initialize the first owner

After applying the migration, set the bootstrap variables locally and run:

```sh
npm run bootstrap
```

The script creates an email-confirmed Auth account and claims the single superuser slot through a database lock. Repeating it for the configured owner makes no changes, including no password change. It refuses to replace an existing superuser or take over a different existing account.

Remove the bootstrap password from `.env.local` or the shell after success. Do not add bootstrap secrets to Vercel; run this command once from a trusted environment.

Sign in as the superuser, open **Administration**, and invite the first global admin. That invitee accepts, signs in, and creates a team, which automatically adds them as its first member. Admins invite further members from **Administration → Manage members**. A global role alone never grants team-content access.

If provisioning is interrupted after the Auth account is created but before bootstrap completes, the script intentionally refuses to reset that account. A trusted database operator should first verify ownership and that `bootstrap_state` is empty, then finish the claim in the Supabase SQL editor with `select public.bootstrap_superuser('VERIFIED_AUTH_USER_UUID'::uuid);`. The function still refuses to replace a previously configured owner. Never delete the singleton record to bypass this guard.

## Deploy to Vercel

1. Import this GitHub repository into Vercel and select the Next.js preset. `vercel.json` supplies the build command. Select Node 24, or a supported Node 22 version at least 22.18.
2. Add the application environment variables to the correct deployment environment. Keep the service key and Resend key server-only. Apply the Supabase migration before letting users sign in.
3. Deploy the `work` branch for review, or configure your chosen production branch. Configure the final `APP_URL` and exact Supabase callback allowlist for the deployment domain, then redeploy if needed.
4. Run bootstrap locally against the intended Supabase project. Complete the manual scenarios in `docs/manual-review.md` before opening the workspace to real teams.

No production deployment or hosted configuration was performed as part of this build. Supabase credentials, Resend credentials, a verified domain, and a Vercel target were not available.

## Access and data model

- `profiles` holds global roles separately from `team_members`. Only the superuser can promote/demote admins or suspend accounts. Suspending an account blocks content access through current database checks.
- Administrators can read team names and membership/invitation metadata for administration. Team wiki pages, todos, files, and announcements always require current membership, including for superusers.
- Personal todos have only an account owner; they have no team ID and no administrative read override.
- Wiki pages and team todos are editable by every member. Only their creator while still a member, or an admin who belongs to that team, can delete them. Column grants prevent changing ownership or moving an item to another team through the REST API.
- Pin wall posts are managed by team-member admins. Members can add/remove their own reactions. Reaction counts are aggregated under RLS.
- Team creation and invitation redemption use database transactions. Server handlers also check the current account and membership. Team content always uses the user's Supabase client, never the service key.
- Membership removal takes effect on subsequent database and authenticated Storage requests. It cannot retract content already displayed or downloaded. A download already in progress may finish.

See [the access review](docs/access-review.md) for the table and policy matrix.

## Vault behavior

Files transfer directly from the browser to Supabase using resumable TUS uploads in 6 MiB chunks, avoiding Vercel function body limits. The browser, server action, metadata constraints, and private Storage bucket enforce the size/type boundaries. Keep the upload page open; interrupted uploads can be cleared, and an already completed transfer can be finalized from **Your incomplete uploads**.

Supported extensions are defined in `src/lib/vault.ts` and the migration. They cover ZIP, PDF, DOC/DOCX, Markdown/text, CSV, and common source-code formats. Unsafe filename characters are normalized for storage; each upload gets a unique object path. Files are delivered as downloads and never executed or unpacked. Extension validation is not malware scanning. No file is indexed for AI.

Downloads make authenticated Storage requests with current membership policies; the app does not create reusable signed links. Files and folders remain owned by the team when their uploader leaves. Completed-file deletion, folder deletion, wiki revision history, and live collaboration were not part of the supplied scope.
