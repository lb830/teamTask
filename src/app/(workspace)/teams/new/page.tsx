import { requireAdmin } from "@/lib/authz/access";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { createTeam } from "@/app/actions/teams";
export default async function NewTeam() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        eyebrow="Make room"
        title="A new team."
        description="Create a home for your team’s knowledge and work. You’ll automatically join as its first member."
      />
      <div className="panel" style={{ maxWidth: 620 }}>
        <ActionForm action={createTeam} className="stack">
          <label>
            Team name
            <input
              name="name"
              placeholder="e.g. Product studio"
              maxLength={80}
              required
            />
          </label>
          <label>
            Team URL{" "}
            <span className="muted">
              Optional. Generated from the name if left blank.
            </span>
            <input
              name="slug"
              placeholder="product-studio"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
            />
          </label>
          <div>
            <SubmitButton>Create team</SubmitButton>
          </div>
        </ActionForm>
      </div>
    </>
  );
}
