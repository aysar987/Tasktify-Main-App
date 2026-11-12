import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { NavigationTracker } from "@/components/back-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <NavigationTracker />
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
