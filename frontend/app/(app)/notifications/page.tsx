import { NotificationList } from "@/components/notification-list";
import { PageHeader } from "@/components/ui";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Notifikasi"
        title="Notifikasi Anda"
        description="Kabar terbaru seputar task, pembayaran, dan status penyedia."
      />
      <NotificationList />
    </>
  );
}
