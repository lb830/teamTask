import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { requireTeam } from "@/lib/authz/access";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { pageNumber, pageRange } from "@/lib/pagination";
export default async function Wiki({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { supabase, team } = await requireTeam((await params).teamSlug);
  const query = await searchParams;
  const page = pageNumber(query.page),
    search = (query.q ?? "").trim().slice(0, 100);
  let request = supabase
    .from("wiki_pages")
    .select("id,slug,title,updated_at")
    .eq("team_id", team.id)
    .order("updated_at", { ascending: false })
    .order("id")
    .range(...pageRange(page));
  if (search)
    request = request.ilike("title", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
  const { data: pages, error } = await request;
  if (error) throw new Error("Could not load wiki pages.");
  const base = `/t/${team.slug}/wiki`;
  return (
    <>
      <PageHeader
        eyebrow={`${team.name} / Knowledge`}
        title="Your team’s shared memory."
        description="A home for the things you know, the things you learn, and the ideas worth keeping."
      >
        <Link className="button" href={`${base}/new`}>
          ＋ New page
        </Link>
      </PageHeader>
      <form className="search-form">
        <input
          name="q"
          type="search"
          aria-label="Search wiki page titles"
          placeholder="Find a page by title…"
          defaultValue={search}
        />
        <button className="button secondary">Search</button>
        {search && (
          <Link href={base} className="button secondary">
            Clear
          </Link>
        )}
      </form>
      <div className="wiki-layout">
        <div>
          {pages?.length ? (
            <div className="card-grid">
              {pages.map((item) => (
                <Link
                  className="panel wiki-card"
                  href={`${base}/${item.slug}`}
                  key={item.id}
                >
                  <BookOpen size={24} />
                  <h2>{item.title}</h2>
                  <p>
                    Open page <ArrowUpRight size={12} />
                  </p>
                  <div className="card-meta">
                    Updated{" "}
                    {new Date(item.updated_at).toLocaleDateString("en-GB", {
                      timeZone: "UTC",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={search ? "No pages found." : "Every team has a story."}
            >
              {search
                ? "Try a different page title."
                : "Start yours with a welcome page, a project guide, or something your team should know."}
            </EmptyState>
          )}
          <Pagination
            page={page}
            count={pages?.length ?? 0}
            base={base}
            query={search ? { q: search } : {}}
          />
        </div>
        <aside className="wiki-side">
          <BookOpen size={24} />
          <h3>Good knowledge grows.</h3>
          <p>Write a little. Add a link. Share what you’ve learned.</p>
          <p>
            Anyone on your team can contribute to a page. Every save is shared
            right away.
          </p>
          <hr />
          <p>Make it yours with Markdown: headings, lists, code, and more.</p>
        </aside>
      </div>
    </>
  );
}
