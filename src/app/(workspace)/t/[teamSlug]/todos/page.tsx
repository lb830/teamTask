import { requireTeam } from "@/lib/authz/access";
import { PageHeader } from "@/components/ui/page-header";
import { TodoBoard, TodoForm } from "@/components/todos/todo-board";
import { Pagination } from "@/components/ui/pagination";
import { pageNumber, pageRange } from "@/lib/pagination";
export default async function TeamTodos({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase, team, profile } = await requireTeam(
    (await params).teamSlug,
  );
  const page = pageNumber((await searchParams).page);
  const { data: todos, error } = await supabase
    .from("team_todos")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false })
    .order("id")
    .range(...pageRange(page));
  if (error) throw new Error("Could not load team todos.");
  return (
    <>
      <PageHeader
        eyebrow={`${team.name} / Progress`}
        title="Good work, in motion."
        description="See what’s next, share the work, and move things forward together."
      />
      <TodoForm teamSlug={team.slug} />
      <TodoBoard todos={todos ?? []} profile={profile} teamSlug={team.slug} />
      <Pagination
        page={page}
        count={todos?.length ?? 0}
        base={`/t/${team.slug}/todos`}
      />
    </>
  );
}
