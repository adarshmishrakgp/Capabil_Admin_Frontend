import { Suspense } from 'react';
import ApplicationsTable, { type Row } from '@/components/ApplicationsTable';
import { Funnel } from '@/components/charts';
import { Badge, Card, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Applications' };
export const dynamic = 'force-dynamic';

type Stats = { kpis: { newApplications: number }; pipeline: Record<string, number> };
type Job = { _id: string; title: string };

const STAGES: [string, string][] = [
  ['new', 'New'],
  ['under_review', 'Under Review'],
  ['shortlisted', 'Shortlisted'],
  ['interview', 'Interview'],
  ['selected', 'Selected'],
  ['hired', 'Hired'],
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; status?: string; search?: string }>;
}) {
  const filters = await searchParams;

  const query = new URLSearchParams({ limit: '100' });
  if (filters.job) query.set('job', filters.job);
  if (filters.status) query.set('status', filters.status);
  if (filters.search) query.set('search', filters.search);

  const [list, stats, jobList] = await Promise.all([
    apiFetch<Row[]>(`/admin/applications?${query}`),
    apiFetch<Stats>('/admin/dashboard/stats'),
    apiFetch<Job[]>('/admin/jobs?limit=100'),
  ]);

  const applications = list.ok ? list.data : [];
  const total = list.ok ? (list.meta?.total ?? applications.length) : 0;
  const pipeline = stats.ok ? stats.data.pipeline : {};
  const roles = jobList.ok ? jobList.data.map((j) => ({ _id: j._id, title: j.title })) : [];

  const filteredRole = roles.find((r) => r._id === filters.job);
  const isFiltered = Boolean(filters.job || filters.status || filters.search);

  // when filtered to one role, the tiles should describe that role, not everything
  const scoped = isFiltered ? applications : null;
  const countOf = (...statuses: string[]) =>
    scoped
      ? scoped.filter((a) => statuses.includes(a.status)).length
      : statuses.reduce((sum, s) => sum + (pipeline[s] ?? 0), 0);

  return (
    <>
      <PageHeader
        title={filteredRole ? filteredRole.title : 'Applications'}
        subtitle={
          filteredRole
            ? 'Everyone who applied for this role. Select candidates to move them through the pipeline together, or open one to review it.'
            : 'Every submission from the careers page. Open a candidate to rate them, leave remarks and call them for interview.'
        }
        actions={
          <a href={`/api/proxy/admin/applications/export?${query}`} className="btn-ghost">
            Export CSV
          </a>
        }
      />

      {!list.ok && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200">
          {list.error}
        </p>
      )}

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            label={isFiltered ? 'Matching this filter' : 'New this week'}
            value={isFiltered ? applications.length : stats.ok ? stats.data.kpis.newApplications : 0}
            hint={isFiltered ? 'applications shown below' : 'received in the last 7 days'}
          />
          <StatCard label="Awaiting review" value={countOf('new', 'under_review')} hint="not yet decided" />
          <StatCard label="Shortlisted" value={countOf('shortlisted')} hint="ready for interview" />
          <StatCard label="In interview" value={countOf('interview')} hint="scheduled or in progress" />
        </div>
        <Card title="Pipeline" description={filteredRole ? filteredRole.title : 'All roles'}>
          <Funnel
            stages={STAGES.map(([key, stage]) => ({
              stage,
              count: scoped ? scoped.filter((a) => a.status === key).length : (pipeline[key] ?? 0),
            }))}
          />
        </Card>
      </div>

      {filteredRole && (
        <p className="mb-4 flex items-center gap-2 text-[15px] text-ink-500">
          <Badge tone="brand">Filtered</Badge>
          Showing applications for <span className="font-medium text-ink-800">{filteredRole.title}</span> only.
        </p>
      )}

      <Card padded={false}>
        {applications.length === 0 ? (
          <EmptyState
            title={list.ok ? (isFiltered ? 'No applications match this filter' : 'No applications yet') : 'Could not load applications'}
            hint={
              list.ok
                ? isFiltered
                  ? 'Try clearing the filters, or wait for candidates to apply to this role.'
                  : 'Submissions from the careers page land here the moment a candidate applies.'
                : 'Fix the error above and reload this page.'
            }
          />
        ) : (
          <Suspense fallback={<div className="p-6 text-[15px] text-ink-500">Loading…</div>}>
            <ApplicationsTable rows={applications} roles={roles} />
          </Suspense>
        )}

        {applications.length > 0 && (
          <div className="border-t border-ink-200 px-5 py-3.5 text-[15px] text-ink-500">
            Showing <span className="font-medium text-ink-700">{applications.length}</span>
            {!isFiltered && (
              <>
                {' '}of <span className="font-medium text-ink-700">{total}</span>
              </>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
