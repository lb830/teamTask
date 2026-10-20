import { notFound } from "next/navigation";
import { requireTeam } from "@/lib/authz/access";
import { PageHeader } from "@/components/ui/page-header";
import { PageEditor } from "@/components/wiki/page-editor";
export default async function EditPage({
  params,
}: {
  params: Promise<{ teamSlug: string; slug: string }>;
}) {
  const { teamSlug, slug } = await params;
  const { supabase, team } = await requireTeam(teamSlug);
  const { data: page } = await supabase
    .from("wiki_pages")
    .select("*")
    .eq("team_id", team.id)
    .eq("slug", slug)
    .maybeSingle();
  if (!page) notFound();
  return (
    <>
      <PageHeader
        eyebrow={`${team.name} / Wiki`}
        title="Keep the knowledge growing."
        description="Your changes are published to the team when you save."
      />
      <div className="panel">
        <PageEditor teamSlug={team.slug} page={page} />
      </div>
    </>
  );
}
