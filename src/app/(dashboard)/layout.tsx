import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { ROLE_LABEL, getSessionUser } from '@/lib/session';
import { apiFetch } from '@/lib/server-api';

type Stats = { kpis: { activeJobs: number; newApplications: number }; pipeline: Record<string, number> };

const OPEN_STAGES = ['new', 'under_review', 'shortlisted', 'interview', 'selected'];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, stats] = await Promise.all([getSessionUser(), apiFetch<Stats>('/admin/dashboard/stats')]);

  const kpis = stats.ok ? stats.data : null;
  const openApplications = kpis
    ? OPEN_STAGES.reduce((sum, stage) => sum + (kpis.pipeline[stage] ?? 0), 0)
    : 0;

  return (
    <div className="min-h-screen">
      <Sidebar
        newApplications={kpis?.kpis.newApplications ?? 0}
        publishedJobs={kpis?.kpis.activeJobs ?? 0}
        openApplications={openApplications}
      />
      <div className="lg:pl-[248px]">
        <Topbar roleLabel={user ? (ROLE_LABEL[user.role] ?? user.role) : 'Signed in'} />
        <main className="mx-auto max-w-[1400px] px-5 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
