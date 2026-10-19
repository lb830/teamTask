# Spec: Pin Wall

## Objective

Provide a team-scoped information wall where team admins post updates and members react.

## Requirements

- A global admin who belongs to a team can create, edit, and remove posts for that team.
- Team members can read posts and add or remove reactions.
- Posts do not have comments or nested discussion.
- Non-members cannot view or react to posts.

## Dependencies

Depends on `teams`.

## Success criteria

- Team admins can publish information on the team's wall.
- Members can react without creating a chat or comment thread.
- Access is limited to current team members.
