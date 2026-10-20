export const PAGE_SIZE = 30;
export function pageNumber(value?: string) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1;
}
export function pageRange(page: number): [number, number] {
  return [(page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1];
}
