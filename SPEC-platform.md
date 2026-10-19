# Spec: Platform

## Objective

Create the deployable application foundation for teamTask. The product is a private, multi-team web app for wiki pages, todos, project files, and an admin pin wall. It has no team chatroom.

## Tech stack

- Next.js and TypeScript, deployed on Vercel.
- Supabase Auth, Postgres, and private Storage.
- Resend for invitation email.
- No AI provider is selected. AI remains a disabled UI entry point.

## Commands

- Development: `npm run dev`
- Production build: `npm run build`
- Production server: `npm run start`
- Lint: `npm run lint`

## Project structure

```text
src/app/                Next.js routes and server actions
src/components/          Shared interface components
src/lib/                 Auth, authorization, email, and storage helpers
supabase/migrations/     Database schema, functions, and row-level policies
public/                  Static assets
```

## Code style

Use strict TypeScript, small named modules, and explicit types at access-control boundaries. Example:

```ts
type AccountRole = "superuser" | "admin" | "member";

type TeamAccess = {
  teamId: string;
  role: AccountRole;
};
```

## Testing strategy

This task will not add or run tests unless the user asks to test or verify the implementation. Keep the app structured so authentication and team-access rules can be covered by tests later.

## Boundaries

- Always: keep secrets in deployment environment variables; enforce team membership in server-side authorization and Supabase row-level policies; store uploaded files in a private bucket.
- Ask first: adding another hosted service or enabling an AI provider.
- Never: allow public signup, expose service credentials to the browser, or serve team files through public URLs.

## Success criteria

- The app has Vercel deployment configuration and setup documentation for Supabase and Resend.
- Database changes are provided as Supabase migrations, including row-level access policies.
- Production configuration requirements are documented without embedding secrets.
