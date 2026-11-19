import { Plus } from "lucide-react";
import Link from "next/link";
import { ActivityList } from "@/components/activity-list";
import { PageHeader, primaryButton } from "@/components/ui";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; new?: string }>;
}) {
  const { tab, new: newTaskId } = await searchParams;
  return <><PageHeader eyebrow="Aktivitas" title="Kelola seluruh task" description="Pantau pekerjaan berjalan, jadwal mendatang, dan riwayat task Anda." action={<Link href="/create-task" className={primaryButton}><Plus className="size-5" /> Task baru</Link>} /><ActivityList key={`${tab ?? ""}-${newTaskId ?? ""}`} tab={tab} newTaskId={newTaskId} /></>;
}
