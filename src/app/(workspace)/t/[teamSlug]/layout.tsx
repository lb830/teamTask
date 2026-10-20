import { requireTeam } from "@/lib/authz/access";
export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string }>;
}) {
  await requireTeam((await params).teamSlug);
  return children;
}
