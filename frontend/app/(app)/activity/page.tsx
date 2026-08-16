import { Plus } from "lucide-react";
import Link from "next/link";
import { ActivityList } from "@/components/activity-list";
import { PageHeader, primaryButton } from "@/components/ui";

export default function ActivityPage() {
  return <><PageHeader eyebrow="Aktivitas" title="Kelola seluruh task" description="Pantau pekerjaan berjalan, jadwal mendatang, dan riwayat task Anda." action={<Link href="/request-task" className={primaryButton}><Plus className="size-5" /> Task baru</Link>} /><ActivityList /></>;
}
