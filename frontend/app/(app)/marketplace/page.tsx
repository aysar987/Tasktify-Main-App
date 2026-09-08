import { redirect } from "next/navigation";

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  redirect(q ? `/market?q=${encodeURIComponent(q)}` : "/market");
}
