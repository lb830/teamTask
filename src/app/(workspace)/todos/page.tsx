import { LockKeyhole } from "lucide-react";
import { requireAccount } from "@/lib/authz/access";
import { PageHeader } from "@/components/ui/page-header";
import { TodoBoard, TodoForm } from "@/components/todos/todo-board";
import { Pagination } from "@/components/ui/pagination";
import { pageNumber, pageRange } from "@/lib/pagination";
export default async function PersonalTodos({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase, user, profile } = await requireAccount();
  const page = pageNumber((await searchParams).page);
  const { data: todos, error } = await supabase
    .from("personal_todos")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .order("id")
    .range(...pageRange(page));
  if (error) throw new Error("Could not load private todos.");
  return (
    <>
      <PageHeader
        eyebrow="Just for you"
        title="A little space to focus."
        description="Your personal todos follow you across teams. Only you can see them."
      >
        <span className="tag">
          <LockKeyhole size={12} /> &nbsp; Private to you
        </span>
      </PageHeader>
      <TodoForm />
      <TodoBoard todos={todos ?? []} profile={profile} />
      <Pagination page={page} count={todos?.length ?? 0} base="/todos" />
    </>
  );
}
