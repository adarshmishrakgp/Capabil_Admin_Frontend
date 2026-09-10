import Link from 'next/link';
import { AreaChart, BarList, Funnel } from '@/components/charts';
import { Avatar, Card, EmptyState, PageHeader, StatCard, StatusBadge } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

type Stats = {
  kpis: {
    activeJobs: number;
    newApplications: number;
    publishedPosts: number;
    confirmedSubscribers: number;
    openLeads: number;
    pendingComments: number;
  };
  pipeline: Record<string, number>;
  applicationTrend: { date: string; count: number }[];
  totalCandidates: number;
};

type Application = {
  _id: string;
  fullName: string;
  status: string;
  totalExperienceYears?: number;
  createdAt: string;
  job?: { _id: string; title: string };
};

type Job = { _id: string; title: string; status: string; applicationCount?: number };

const STAGES: [string, string][] = [
  ['new', 'New'],
  ['under_review', 'Under Review'],
  ['shortlisted', 'Shortlisted'],
  ['interview', 'Interview'],
  ['selected', 'Selected'],
  ['hired', 'Hired'],
];

/**
 * The last 30 days of applications, padded so every day has a point — an
 * absent day means nobody applied, which is a zero, not a gap in the line.
 */
function dailySeries(trend: { date: string; count: number }[]): { label: string; value: number }[] {
  const counts = new Map(trend.map((point) => [point.date, point.count]));
  return Array.from({ length: 30 }, (_, index) => {
    const day = new Date(Date.now() - (29 - index) * 86_400_000).toISOString().slice(0, 10);
    return { label: day, value: counts.get(day) ?? 0 };
  });
}

export default async function DashboardPage() {
  const [stats, recent, jobList] = await Promise.all([
    apiFetch<Stats>('/admin/dashboard/stats'),
    apiFetch<Application[]>('/admin/applications?limit=6&sort=-createdAt'),
    apiFetch<Job[]>('/admin/jobs?limit=100'),
  ]);

  const kpis = stats.ok ? stats.data.kpis : null;
  const pipeline = stats.ok ? stats.data.pipeline : {};
  const trend = stats.ok ? dailySeries(stats.data.applicationTrend) : [];
  const totalInTrend = trend.reduce((sum, point) => sum + point.value, 0);
  const applications = recent.ok ? recent.data : [];

  const topJobs = (jobList.ok ? jobList.data : [])
    .filter((job) => (job.applicationCount ?? 0) > 0)
    .sort((a, b) => (b.applicationCount ?? 0) - (a.applicationCount ?? 0))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Here is what moved across careers and audience in the last 30 days."
        actions={
          <Link href="/jobs/new" className="btn-primary">
            Post a job
          </Link>
        }
      />

      {!stats.ok && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200">
          {stats.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={kpis?.activeJobs ?? 0} hint="published and open" href="/jobs" />
        <StatCard
          label="New applications (7d)"
          value={kpis?.newApplications ?? 0}
          hint="received in the last 7 days"
          href="/applications"
        />
        <StatCard
          label="Newsletter subscribers"
          value={kpis?.confirmedSubscribers ?? 0}
          hint="confirmed"
          href="/newsletter"
        />
        <StatCard
          label="Candidates in pool"
          value={stats.ok ? stats.data.totalCandidates : 0}
          hint="unique people"
          href="/candidates"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Applications received"
          description={`Last 30 days · ${totalInTrend} total`}
        >
          <AreaChart points={trend} valueLabel="Applications" label="Applications received per day, last 30 days" />
        </Card>

        <Card title="Recruitment pipeline" description="Across all roles">
          <Funnel stages={STAGES.map(([key, stage]) => ({ stage, count: pipeline[key] ?? 0 }))} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card
          title="Applications by role"
          description="Busiest openings"
          action={
            <Link href="/jobs" className="text-[13px] font-medium text-brand-600 hover:underline">
              All jobs
            </Link>
          }
        >
          {topJobs.length > 0 ? (
            <BarList items={topJobs.map((job) => ({ label: job.title, value: job.applicationCount ?? 0 }))} />
          ) : (
            <p className="py-6 text-center text-[15px] text-ink-400">
              No applications yet — they appear here as candidates apply.
            </p>
          )}
        </Card>

        <Card
          title="Needs your attention"
          description="Open items across the panel"
          action={
            <Link href="/applications?status=new" className="text-[13px] font-medium text-brand-600 hover:underline">
              Open inbox
            </Link>
          }
        >
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              ['Awaiting review', (pipeline.new ?? 0) + (pipeline.under_review ?? 0), '/applications?status=new'],
              ['In interview', pipeline.interview ?? 0, '/applications?status=interview'],
              ['Open leads', kpis?.openLeads ?? 0, '/leads'],
            ].map(([label, value, href]) => (
              <Link
                key={label as string}
                href={href as string}
                className="rounded-xl border border-ink-200 px-3 py-4 transition-colors hover:bg-ink-50"
              >
                <dt className="text-xs uppercase tracking-wider text-ink-400">{label as string}</dt>
                <dd className="mt-1 text-2xl font-semibold text-ink-900">{value as number}</dd>
              </Link>
            ))}
          </dl>
          <p className="mt-4 border-t border-ink-200 pt-4 text-[13px] text-ink-400">
            A role closes itself once its deadline passes, so anything still listed as active is genuinely open.
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card
          title="Latest applications"
          padded={false}
          action={
            <Link href="/applications" className="text-[13px] font-medium text-brand-600 hover:underline">
              Open inbox
            </Link>
          }
        >
          {applications.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {applications.map((application) => (
                <li key={application._id}>
                  <Link
                    href={`/applications/${application._id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink-50/60"
                  >
                    <Avatar name={application.fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-ink-800">{application.fullName}</p>
                      <p className="truncate text-[13px] text-ink-500">
                        {application.job?.title ?? 'Role removed'}
                        {application.totalExperienceYears != null
                          ? ` · ${application.totalExperienceYears} yrs`
                          : ''}
                      </p>
                    </div>
                    <StatusBadge status={application.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={recent.ok ? 'No applications yet' : 'Could not load applications'}
              hint={
                recent.ok
                  ? 'Submissions from the careers site land here the moment a candidate applies.'
                  : recent.error
              }
            />
          )}
        </Card>
      </div>
    </>
  );
}
