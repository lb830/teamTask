import Link from "next/link";
import { PAGE_SIZE } from "@/lib/pagination";
export function Pagination({
  page,
  count,
  base,
  parameter = "page",
  query = {},
}: {
  page: number;
  count: number;
  base: string;
  parameter?: string;
  query?: Record<string, string>;
}) {
  function href(next: number) {
    const params = new URLSearchParams({ ...query, [parameter]: String(next) });
    return `${base}?${params}`;
  }
  if (page === 1 && count < PAGE_SIZE) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
      <span className="small muted">Page {page}</span>
      {count === PAGE_SIZE && <Link href={href(page + 1)}>Next</Link>}
    </nav>
  );
}
