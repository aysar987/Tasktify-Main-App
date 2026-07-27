import { RequestTaskForm } from "@/components/request-task-form";
import { PageHeader } from "@/components/ui";

export default function RequestTaskPage() {
  return <><PageHeader eyebrow="Task baru" title="Apa yang perlu diselesaikan?" description="Ceritakan kebutuhan Anda dan kami akan mencarikan tenaga profesional yang tepat." backHref="/dashboard" /><RequestTaskForm /></>;
}
