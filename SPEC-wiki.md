# Spec: Wiki

## Objective

Provide team-hosted Markdown wiki pages, accessible only to members of that team.

## Requirements

- A team member can create and edit any wiki page in their team.
- A saved page is published to the team immediately; there is no draft or approval step.
- Pages are written and stored as Markdown.
- The page author, while still a team member, or a global admin who is a member of that team can delete a page.
- Removing membership ends access immediately. Pages stay with the team.

## Dependencies

Depends on `teams`.

## Success criteria

- Members of a team can create, read, and edit that team's pages.
- Non-members cannot view pages even if they know a page URL.
- Deletion follows the stated author/admin membership rule.
