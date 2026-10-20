import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeam, isAdminRole } from "@/lib/authz/access";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm, DeleteButton } from "@/components/ui/action-form";
import { deleteWikiPage } from "@/app/actions/wiki";
import { MarkdownView } from "@/components/wiki/markdown-view";
export default async function ReadPage({
  params,
}: {
  params: Promise<{ teamSlug: string; slug: string }>;
}) {
  const { teamSlug, slug } = await params;
  const { supabase, team, profile, user } = await requireTeam(teamSlug);
  const { data: page } = await supabase
    .from("wiki_pages")
    .select("*")
    .eq("team_id", team.id)
    .eq("slug", slug)
    .maybeSingle();
  if (!page) notFound();
  return (
    <>
      <div className="breadcrumbs">
        <Link href={`/t/${team.slug}/wiki`}>Wiki</Link>
        <span>/</span>
        <span>{page.title}</span>
      </div>
      <PageHeader
        eyebrow={team.name}
        title={page.title}
        description={`Last updated ${new Date(page.updated_at).toLocaleDateString("en-GB", { timeZone: "UTC", dateStyle: "long" })}`}
      >
        <div className="button-row">
          <Link
            className="button"
            href={`/t/${team.slug}/wiki/${page.slug}/edit`}
          >
            Edit page
          </Link>
          {(page.created_by === user.id || isAdminRole(profile.role)) && (
            <ActionForm action={deleteWikiPage}>
              <input name="team_slug" value={team.slug} type="hidden" />
              <input name="id" value={page.id} type="hidden" />
              <DeleteButton />
            </ActionForm>
          )}
        </div>
      </PageHeader>
      <article className="panel">
        <MarkdownView
          body={page.body || "*This page is waiting for its first words.*"}
        />
      </article>
    </>
  );
}
