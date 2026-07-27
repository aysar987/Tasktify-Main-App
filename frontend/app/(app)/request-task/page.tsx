import { RequestTaskForm } from "@/components/request-task-form";
import { PageHeader } from "@/components/ui";

export default async function RequestTaskPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams;
  return <><PageHeader eyebrow="Task baru" title="Apa yang perlu diselesaikan?" description="Ceritakan kebutuhan Anda dan kami akan mencarikan tenaga profesional yang tepat." backHref="/dashboard" /><RequestTaskForm providerId={provider} /></>;
}
