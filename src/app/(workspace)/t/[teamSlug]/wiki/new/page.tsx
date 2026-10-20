import { requireTeam } from "@/lib/authz/access";
import { PageHeader } from "@/components/ui/page-header";
import { PageEditor } from "@/components/wiki/page-editor";
export default async function NewPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { team } = await requireTeam((await params).teamSlug);
  return (
    <>
      <PageHeader
        eyebrow={`${team.name} / Wiki`}
        title="Something worth sharing."
        description="Create a page for your team. Your words become part of the shared memory."
      />
      <div className="panel">
        <PageEditor teamSlug={team.slug} />
      </div>
    </>
  );
}
