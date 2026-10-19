# teamTask Implementation Tasks

Implementation authorized by the user and completed for the repository scope. Checkboxes below record implementation coverage, not live-service verification. Service-dependent checks and unavailable deployment setup are documented in [`../docs/implementation-status.md`](../docs/implementation-status.md). Verification below remains manual and scenario-based; no automated tests are included.

## Phase 1: Foundation

### Task 01: Scaffold the Next.js application

**Description:** Add the Next.js App Router, TypeScript, lint, and CSS build configuration needed for the Vercel app.

**Acceptance criteria:**

- [x] The project has the agreed Next.js and TypeScript scripts and configuration.
- [x] Dependencies are limited to the app's needs: Supabase, Resend, Markdown, and the chosen UI icon library.

**Verification:** Review the scripts and configuration; with dependencies installed, confirm the app starts using `npm run dev`.

**Dependencies:** None.

**Files likely touched:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`.

**Estimated scope:** Medium (5 files).

### Task 02: Build the wiki-first workspace shell

**Description:** Create the responsive application frame, team navigation, account controls, and initial setup-required view.

**Acceptance criteria:**

- [x] Wiki is the first team destination.
- [x] Navigation includes wiki, personal todos, team todos, vault, pin wall, and disabled AI.
- [x] The shell gives clear setup guidance when required Supabase environment values are missing, without exposing team data.

**Verification:** Manually inspect desktop and narrow layouts in the configured and setup-required states.

**Dependencies:** Task 01.

**Files likely touched:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/components/workspace/app-shell.tsx`, `src/components/workspace/navigation.tsx`.

**Estimated scope:** Medium (5 files).

### Task 03: Add Supabase clients, schema, and access policies

**Description:** Create typed browser/server Supabase clients and the initial migration for profiles, teams, membership, invitations, wiki, todos, vault metadata, pin wall, and reactions.

**Acceptance criteria:**

- [x] Every team-owned table has a team identifier and membership-based read/write policies.
- [x] Private todos are readable only by their creator and are not team-scoped.
- [x] Global roles do not bypass team-content membership policies.
- [x] Team creators are added to their new team by the database workflow.

**Verification:** Review every policy against a member, non-member, global-admin non-member, and superuser non-member scenario.

**Dependencies:** Task 01.

**Files likely touched:** `src/lib/supabase/env.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/database.types.ts`, `supabase/migrations/0001_core.sql`.

**Estimated scope:** Medium (5 files).

### Task 04: Implement sign-in and password recovery

**Description:** Add Supabase Auth sign-in, session refresh, callback handling, and password reset/update flows.

**Acceptance criteria:**

- [x] Signed-out users cannot open workspace routes.
- [x] Users can sign in and reset their passwords through Supabase Auth.
- [x] Public signup remains unavailable; account creation is invitation-only.

**Verification:** Manually follow sign-in, sign-out, expired-session, and password-reset flows with a configured Supabase project.

**Dependencies:** Tasks 02 and 03.

**Files likely touched:** `middleware.ts`, `src/app/login/page.tsx`, `src/app/actions/auth.ts`, `src/app/auth/callback/route.ts`, `src/components/auth/login-form.tsx`.

**Estimated scope:** Medium (5 files).

## Phase 2: Identity and teams

### Task 05: Bootstrap the superuser and deliver initial admin invitations

**Description:** Seed the initial superuser from environment variables and add secure Resend invitation delivery and acceptance for the first global admin.

**Acceptance criteria:**

- [x] The bootstrap is idempotent and cannot replace an already configured superuser.
- [x] The superuser can invite the first global admin; the invitation is single-use and expires after seven days.
- [x] A new invitee can set a password; an existing account can accept without creating a duplicate.

**Verification:** Manually accept a valid invitation, then confirm expired, revoked, and reused tokens are rejected.

**Dependencies:** Tasks 03 and 04.

**Files likely touched:** `scripts/bootstrap-superuser.ts`, `src/lib/email/resend.ts`, `src/app/actions/admin-invitations.ts`, `src/app/invite/[token]/page.tsx`, `src/components/auth/accept-invite-form.tsx`.

**Estimated scope:** Medium (5 files).

### Task 06: Add global admin role management

**Description:** Let the superuser promote or demote global admins and manage accounts without granting team-content access.

**Acceptance criteria:**

- [x] Only the superuser can change global admin roles.
- [x] A promoted admin can create teams and manage invitations/memberships across teams.
- [x] Role changes do not add the admin to teams or expose their content.

**Verification:** Manually compare superuser, global-admin, and member capabilities with and without team membership.

**Dependencies:** Task 05.

**Files likely touched:** `src/app/admin/page.tsx`, `src/app/actions/admin-roles.ts`, `src/lib/authz/roles.ts`, `src/components/admin/role-manager.tsx`.

**Estimated scope:** Small (4 files).

### Task 07: Create teams and switch active team

**Description:** Allow global admins to create teams and let accounts switch among their team memberships.

**Acceptance criteria:**

- [x] Only a global admin can create a team.
- [x] The creator is automatically added as a member of the new team.
- [x] A user can switch only to teams they belong to.

**Verification:** Manually create two teams, switch between them, and try a non-member team URL.

**Dependencies:** Task 06.

**Files likely touched:** `src/app/actions/teams.ts`, `src/app/teams/new/page.tsx`, `src/app/t/[teamSlug]/layout.tsx`, `src/components/workspace/team-switcher.tsx`, `src/components/workspace/navigation.tsx`.

**Estimated scope:** Medium (5 files).

### Task 08: Invite and manage team members

**Description:** Reuse Resend invitation delivery for team-scoped member invitations and add member removal and invitation management.

**Acceptance criteria:**

- [x] Global admins can invite a person to any team and resend or revoke the invite.
- [x] Invitations expire after seven days and can be accepted once.
- [x] Removing membership immediately blocks team content and file access; existing team content remains.

**Verification:** Manually accept, resend, revoke, and expire invitations, then remove a member and attempt to revisit team routes and files.

**Dependencies:** Tasks 05 and 07.

**Files likely touched:** `src/app/actions/team-members.ts`, `src/app/t/[teamSlug]/members/page.tsx`, `src/components/admin/invite-member-form.tsx`, `src/components/admin/member-list.tsx`.

**Estimated scope:** Medium (4 files).

## Phase 3: Team capabilities

### Task 09: Implement team Markdown wiki

**Description:** Add page listing, creation, editing, Markdown preview/rendering, and protected deletion.

**Acceptance criteria:**

- [x] Team members can create and edit any page in that team; saving publishes immediately.
- [x] A page author who remains a member or a team-member global admin can delete it.
- [x] Non-members cannot read a page by guessing its URL.

**Verification:** Manually create, edit, render Markdown, and delete pages as authorized users; repeat reads as a non-member.

**Dependencies:** Tasks 03 and 08.

**Files likely touched:** `src/app/t/[teamSlug]/wiki/page.tsx`, `src/app/t/[teamSlug]/wiki/[slug]/page.tsx`, `src/app/actions/wiki.ts`, `src/components/wiki/page-editor.tsx`, `src/components/wiki/markdown-view.tsx`.

**Estimated scope:** Medium (5 files).

### Task 10: Implement private account-wide todos

**Description:** Add the creator-only personal todo list, independent of the currently selected team.

**Acceptance criteria:**

- [x] A user's private todos appear across team switches.
- [x] No other member, global admin, or superuser can read them.
- [x] Users can create, edit, complete, and delete their own private todos.

**Verification:** Manually compare two signed-in accounts and confirm that switching teams does not change a creator's private list.

**Dependencies:** Tasks 03 and 04.

**Files likely touched:** `src/app/todos/page.tsx`, `src/app/actions/personal-todos.ts`, `src/components/todos/personal-todo-list.tsx`, `src/components/todos/todo-form.tsx`.

**Estimated scope:** Small (4 files).

### Task 11: Implement public team todos

**Description:** Add team-scoped todos with shared editing, three statuses, and optional due dates.

**Acceptance criteria:**

- [x] Every team member can view and edit team todos.
- [x] Todos support To do, In progress, and Done states plus an optional due date.
- [x] The creator while still a member, or a global admin who belongs to the team, can delete.

**Verification:** Manually create and edit a todo as two members, then check deletion rights as a member, admin member, and non-member.

**Dependencies:** Tasks 03 and 08.

**Files likely touched:** `src/app/t/[teamSlug]/todos/page.tsx`, `src/app/actions/team-todos.ts`, `src/components/todos/team-board.tsx`, `src/components/todos/todo-card.tsx`.

**Estimated scope:** Small (4 files).

### Task 12: Implement the team vault

**Description:** Add named project folders, standalone files, and private team uploads/downloads.

**Acceptance criteria:**

- [x] Members can upload supported files up to 100 MB into a project or as standalone team files.
- [x] Non-members cannot list or download files, including through a direct storage URL.
- [x] ZIP archives are retained for download and are not unpacked or indexed.

**Verification:** Manually upload, download, and reject unsupported/oversized files; attempt access after membership removal.

**Dependencies:** Tasks 03 and 08.

**Files likely touched:** `src/app/t/[teamSlug]/vault/page.tsx`, `src/app/actions/vault.ts`, `src/components/vault/file-uploader.tsx`, `src/components/vault/project-list.tsx`, `src/components/vault/file-list.tsx`.

**Estimated scope:** Medium (5 files).

### Task 13: Implement the admin pin wall

**Description:** Add team admin posts and member reactions without comments or threads.

**Acceptance criteria:**

- [x] A global admin who belongs to the team can create and manage wall posts.
- [x] Team members can read posts and add/remove reactions.
- [x] No comments or chatroom are present; non-members cannot view the wall.

**Verification:** Manually create a post as a team admin, react as members, and attempt access as a non-member.

**Dependencies:** Tasks 03 and 08.

**Files likely touched:** `src/app/t/[teamSlug]/wall/page.tsx`, `src/app/actions/pin-wall.ts`, `src/components/pin-wall/wall-feed.tsx`, `src/components/pin-wall/post-composer.tsx`, `src/components/pin-wall/reaction-bar.tsx`.

**Estimated scope:** Medium (5 files).

### Task 14: Add the disabled AI entry point

**Description:** Present the agreed disabled state and setup guidance without implementing provider calls or conversation storage.

**Acceptance criteria:**

- [x] Team members can see that AI chat is unavailable until a provider is selected.
- [x] The disabled view makes no AI requests and does not claim to index files.
- [x] There is no team chatroom or comment feature.

**Verification:** Manually open the AI area and inspect the UI and network behavior for provider calls.

**Dependencies:** Tasks 07 and 12.

**Files likely touched:** `src/app/t/[teamSlug]/ai/page.tsx`, `src/components/ai/disabled-assistant.tsx`, `src/components/workspace/navigation.tsx`.

**Estimated scope:** Small (3 files).

## Phase 4: Handoff

### Task 15: Document production setup and push the completed app

**Description:** Document Vercel, Supabase, private Storage, Resend, superuser bootstrap, and environment variables, then commit and push the approved app work to the configured GitHub remote.

**Acceptance criteria:**

- [x] A new operator can configure required environment values without secrets in source control.
- [x] Setup docs explain the Supabase migrations, storage upload limit, Resend verified sender, and initial superuser.
- [x] The completed app and its setup docs are pushed to the `work` branch.

**Verification:** Review the setup guide against the environment template and confirm the pushed branch contains app files and docs, not local skill files or secrets.

**Dependencies:** Tasks 01–14.

**Files likely touched:** `README.md`, `.env.example`, `vercel.json`, `supabase/config.toml`.

**Estimated scope:** Small (4 files plus GitHub handoff).
