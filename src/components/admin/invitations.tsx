import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { invite, manageInvitation } from "@/app/actions/invitations";
import type { Invitation } from "@/lib/database.types";
export function InviteForm({ teamId }: { teamId?: string }) {
  return (
    <ActionForm action={invite} className="stack">
      <input type="hidden" name="team_id" value={teamId ?? ""} />
      <label>
        Email address
        <input
          type="email"
          name="email"
          placeholder="colleague@example.com"
          maxLength={254}
          required
        />
      </label>
      <div>
        <SubmitButton pendingLabel="Sending…">
          {teamId ? "Invite to team" : "Invite global admin"}
        </SubmitButton>
      </div>
      <p className="small muted">
        The invitation expires in seven days. Existing accounts can join with
        their current password.
      </p>
    </ActionForm>
  );
}
export function InvitationList({ invitations }: { invitations: Invitation[] }) {
  if (!invitations.length) return <p className="muted">No invitations yet.</p>;
  return (
    <div>
      {invitations.map((invitation) => {
        const status = invitation.accepted_at
          ? "Accepted"
          : invitation.revoked_at
            ? "Revoked"
            : new Date(invitation.expires_at) < new Date()
              ? "Expired"
              : invitation.delivery_status === "failed"
                ? "Delivery failed"
                : invitation.delivery_status === "pending"
                  ? "Delivery pending"
                  : "Sent";
        return (
          <div className="list-row" key={invitation.id}>
            <div>
              <strong>{invitation.email}</strong>
              <p>
                {status} · Expires{" "}
                {new Date(invitation.expires_at).toLocaleDateString("en-GB", {
                  timeZone: "UTC",
                })}
              </p>
            </div>
            {!invitation.accepted_at && !invitation.revoked_at && (
              <div className="table-actions">
                <ActionForm action={manageInvitation}>
                  <input name="id" value={invitation.id} type="hidden" />
                  <input name="operation" value="resend" type="hidden" />
                  <SubmitButton
                    className="button secondary small"
                    pendingLabel="Sending…"
                  >
                    Resend invitation
                  </SubmitButton>
                </ActionForm>
                <ActionForm action={manageInvitation}>
                  <input name="id" value={invitation.id} type="hidden" />
                  <input name="operation" value="revoke" type="hidden" />
                  <SubmitButton className="button danger small">
                    Revoke
                  </SubmitButton>
                </ActionForm>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
