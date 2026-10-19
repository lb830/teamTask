# Spec: Identity

## Objective

Provide invite-only account access using Supabase Auth and Resend. Users accept an invitation by email and set a password. Password reset is handled through Supabase Auth.

## Requirements

- There is no public signup flow.
- Team invitations are single-use and expire after seven days.
- A global admin can resend or revoke a team invitation.
- Resend sends invitations using a configured API key and verified sender domain.
- Supabase Auth handles password credentials, sessions, and password resets.
- The first superuser is initialized from deployment environment variables. The superuser can invite and promote the first global admin.
- Do not hardcode, log, or commit credentials.

## Dependencies

Depends on `platform`. Team-specific invitations also use the `teams` capability.

## Success criteria

- An invited person can accept an invitation, set a password, and sign in.
- An expired, revoked, or already-used invitation cannot grant access.
- Existing accounts can accept invitations to additional teams without creating duplicate accounts.
