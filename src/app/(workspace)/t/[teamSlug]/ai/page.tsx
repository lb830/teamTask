import { Sparkles } from "lucide-react";
import { requireTeam } from "@/lib/authz/access";
import { PageHeader } from "@/components/ui/page-header";
export default async function Assistant({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { team } = await requireTeam((await params).teamSlug);
  return (
    <>
      <PageHeader
        eyebrow={`${team.name} / Coming later`}
        title="A little help, on the horizon."
        description="A future space to ask questions about your team’s files."
      />
      <div className="panel disabled-assistant">
        <div className="assistant-icon">
          <Sparkles size={32} />
        </div>
        <span className="tag">Not available yet</span>
        <h2 style={{ marginTop: 20 }}>Meet your future assistant.</h2>
        <p className="muted">
          AI is disabled until an assistant provider is selected and configured
          for teamTask.
        </p>
        <p className="small muted">
          For now, your files stay in the vault. Nothing is sent to an AI
          provider, indexed, or saved as a conversation.
        </p>
        <textarea
          aria-label="Assistant unavailable"
          disabled
          placeholder="Your questions will have a home here…"
        />
        <button className="button secondary" disabled>
          Assistant unavailable
        </button>
      </div>
    </>
  );
}
