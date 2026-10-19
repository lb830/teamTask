import "server-only";
/** Read small directory lists completely instead of silently truncating at REST's row limit. */
export async function collectPages<T>(
  load: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  const batchSize = 500;
  for (let from = 0; ; from += batchSize) {
    const { data, error } = await load(from, from + batchSize - 1);
    if (error) throw new Error("Could not load the complete directory.");
    rows.push(...(data ?? []));
    if (!data || data.length < batchSize) return rows;
  }
}
