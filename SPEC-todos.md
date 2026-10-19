# Spec: Todos

## Objective

Provide one private account-wide todo list and team-visible todos scoped to each team.

## Requirements

- Private todos follow the account across teams and are visible only to their creator, including hidden from admins.
- A member can create public todos for the active team.
- All members of a team can view and edit that team's public todos.
- The todo creator, while a member of the team, or a global admin who belongs to the team can delete a public todo.
- Public todos have `To do`, `In progress`, and `Done` states and an optional due date.
- Membership removal ends access to team todos immediately. Team-visible todos remain with the team.

## Dependencies

Depends on `teams`.

## Success criteria

- Private todos are inaccessible to every other account and role.
- Public todos are available only to members of their team.
- Team members can edit public todos and deletion follows the stated creator/admin rule.
