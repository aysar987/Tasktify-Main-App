import { NotificationList } from "@/components/notification-list";
import { PageHeader } from "@/components/ui";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notification"
      />
      <NotificationList />
    </>
  );
}
