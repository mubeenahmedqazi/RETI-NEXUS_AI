import DashboardClient from '@/components/Dashboard/DashboardClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClient>{children}</DashboardClient>;
}
