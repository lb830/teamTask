# Access review

Source review completed against `supabase/migrations/0001_core.sql` and all server actions. This is not evidence of a live Supabase authorization run; those scenarios require a configured development project.

| Resource            | Read                                                  | Create/edit                                                                            | Delete or manage                                                               |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Profiles            | Self; admins can read the account directory           | Self can edit display name only                                                        | Role/suspension RPCs are superuser-only; superuser cannot be demoted/suspended |
| Bootstrap state     | No client access                                      | Service-role-only singleton RPC with advisory lock                                     | No client access; owner reference restricts deletion                           |
| Team metadata       | Members and global admins                             | Admin-only transactional team creation                                                 | No team deletion exposed                                                       |
| Memberships         | Team members and global admins                        | Team creation or invitation redemption only                                            | Global admins can remove membership                                            |
| Invitations         | Team invites: global admins; admin invites: superuser | Current administrator authority; email-bound atomic redemption                         | Admins revoke/resend team invitations; superuser manages admin invitations     |
| Wiki                | Current team members                                  | Current team members                                                                   | Creator who is still a member, or team-member admin                            |
| Personal todos      | Creator only, including against admins                | Creator only                                                                           | Creator only                                                                   |
| Team todos          | Current team members                                  | Current team members                                                                   | Creator who is still a member, or team-member admin                            |
| Vault projects      | Current team members                                  | Current members can create                                                             | Not exposed                                                                    |
| Vault file metadata | Current team members                                  | Current members create pending records; owner finalizes after stored-size verification | Owner can clear an incomplete upload while a member                            |
| Storage objects     | Exact registered path and current membership          | Exact pending path, current membership, and uploader identity                          | Pending objects only, by their owner while a member                            |
| Pin wall            | Current team members                                  | Global admin AND current membership                                                    | Global admin AND current membership                                            |
| Reactions           | Current team members                                  | Current member, own user ID, same-team post FK                                         | Own reactions while still a member                                             |

## Boundaries reviewed

- RLS is enabled on every application table, including bootstrap state with no client policies.
- Read/write content policies do not use a global role as a substitute for membership.
- Role and membership checks query the database, not cached JWT role claims. Per-request React memoization avoids duplicate checks within one render; it is not a persistent authorization cache.
- Column grants prevent reassignment of authorship, IDs, team scope, and protected invitation/role fields via the public REST API.
- Security-definer functions use a fixed empty search path and have explicit execute grants. Bootstrap is not callable by authenticated or anonymous clients.
- Invitation redemption locks the row, verifies expiry/revocation/use and confirmed email, checks the sender's current authority, grants the role/membership, and consumes the invitation in one transaction.
- An account provisioned just as an invitation is revoked can remain an ordinary account without team membership. The failed redemption grants no role or membership. It is intentionally not automatically deleted, avoiding a race that could delete a successfully accepted account.
- File metadata and composite foreign keys prevent references to a different team's folder or wall post. Storage policies compare exact paths without casting attacker-supplied path segments to UUIDs.
- Downloads use current authenticated Storage requests with zero cache duration, not signed links. Public bucket URLs are not used.
- Markdown skips raw HTML, filters link protocols, and turns remote images into explicit links to avoid automatic reader tracking.
- Service credentials are behind `server-only`. Only invited-account provisioning and invitation lookup use the service client. No team-content handler uses it.
- Supabase public signup must also be disabled in the hosted project. Configuration files alone do not configure a hosted Supabase project.

## Limits of this review

The migration has not been applied to a hosted Supabase project here. Auth email delivery, service-specific Storage behavior, the deployed row policies, and cross-account scenarios remain unverified until the manual review is completed. Previously displayed/downloaded content and transfers already in progress cannot be revoked retroactively.
