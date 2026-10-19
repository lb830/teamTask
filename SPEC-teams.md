# Spec: Teams and Roles

## Objective

Support multiple teams per account, global admin management, and strict team membership boundaries for content.

## Roles and permissions

- `superuser`: provisioned from environment variables; manages accounts and global roles across the app. The superuser does not gain team-content access without membership.
- `admin`: promoted by a superuser; can create teams and manage members and invitations across teams. Admins can access team content only when they belong to that team.
- `member`: joins teams by invitation and can use member features in those teams.
- A global admin who creates a team is automatically a member of that team.

## Requirements

- An account can belong to multiple teams and switch between them.
- Removing a user's team membership removes access immediately. Team content remains available to the team.
- Team authorization is checked against current membership, not only a potentially stale session claim.
- The superuser invites and promotes the first global admin. That admin creates the first team.

## Dependencies

Depends on `identity`.

## Success criteria

- Users can see and access only teams they belong to.
- Global admins can manage invitations and memberships without automatically seeing team content.
- A non-member cannot read team content through a direct URL or API request.
