import type { Metadata } from "next";
import { TaskMarketBrowser } from "@/components/task-market-browser";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
	title: "Task tersedia",
};

export default async function ProviderTaskMarketPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
	const { q } = await searchParams;
	return (
		<>
			<PageHeader title="Task yang tersedia" />
			<TaskMarketBrowser initialQuery={q} />
		</>
	);
}
