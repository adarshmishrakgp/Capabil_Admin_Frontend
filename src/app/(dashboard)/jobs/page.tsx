import Link from 'next/link';
import JobRowActions from '@/components/JobRowActions';
import JobsToolbar from '@/components/JobsToolbar';
import { Badge, Card, EmptyState, PageHeader, StatCard, StatusBadge, Table, humanize } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Jobs' };
export const dynamic = 'force-dynamic';

type Job = {
  _id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  workMode: string;
  employmentType: string;
  openings: number;
  applicationCount: number;
  viewCount: number;
  status: string;
  deadline?: string;
  publishedAt?: string;
};

const date = (value?: string) => (value ? new Date(value).toISOString().slice(0, 10) : '—');

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'];
const STATUSES = ['published', 'draft', 'paused', 'closed'];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; department?: string; employmentType?: string; status?: string }>;
}) {
  const { search, department, employmentType, status } = await searchParams;

  const query = new URLSearchParams({ limit: '100' });
  if (search) query.set('search', search);
  if (department) query.set('department', department);
  if (employmentType) query.set('employmentType', employmentType);
  if (status) query.set('status', status);

  const [result, departmentResult, allResult] = await Promise.all([
    apiFetch<Job[]>(`/admin/jobs?${query}`),
    apiFetch<string[]>('/admin/jobs/departments'),
    // The tiles describe every role, not the current filter — otherwise
    // filtering to "Draft" would report zero published jobs.
    apiFetch<Job[]>('/admin/jobs?limit=200'),
  ]);

  const jobs = result.ok ? result.data : [];
  const departments = departmentResult.ok ? departmentResult.data : [];
  const everything = allResult.ok ? allResult.data : jobs;
  const isFiltered = Boolean(search || department || employmentType || status);

  const count = (value: string) => everything.filter((j) => j.status === value).length;
  const totalApplications = everything.reduce((sum, j) => sum + (j.applicationCount ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="Create, publish and close openings. Published roles appear on capabiliq.com/careers within a minute."
        actions={
          <>
            <a href="/api/proxy/admin/jobs/export" className="btn-ghost">
              Export CSV
            </a>
            <Link href="/jobs/new" className="btn-primary">
              + New job
            </Link>
          </>
        }
      />

      {!result.ok && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          {result.error}
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published" value={count('published')} hint="live on careers page" />
        <StatCard label="Draft" value={count('draft')} hint="not visible publicly" />
        <StatCard label="Paused" value={count('paused')} hint="hidden, applications retained" />
        <StatCard label="Total applications" value={totalApplications} hint="across all roles" />
      </div>

      <Card padded={false}>
        {/* The toolbar always renders, even with no rows: a filter that matches
            nothing must still be reachable to undo. */}
        <JobsToolbar
          search={search}
          department={department}
          employmentType={employmentType}
          status={status}
          departments={departments}
          employmentTypes={EMPLOYMENT_TYPES}
          statuses={STATUSES}
        />

        {jobs.length === 0 ? (
          <EmptyState
            title={
              !result.ok ? 'Could not load jobs' : isFiltered ? 'No jobs match these filters' : 'No jobs yet'
            }
            hint={
              !result.ok
                ? 'Fix the error above and reload this page.'
                : isFiltered
                  ? 'Nothing matches what you picked above. Change a filter, or clear them to see every role again.'
                  : 'Post your first opening — it stays a draft until you publish it.'
            }
            action={
              !result.ok ? undefined : isFiltered ? (
                <Link href="/jobs" className="btn-ghost mt-2">
                  Clear filters
                </Link>
              ) : (
                <Link href="/jobs/new" className="btn-primary mt-2">
                  + New job
                </Link>
              )
            }
          />
        ) : (
          <Table head={['Role', 'Department', 'Location', 'Type', 'Applications', 'Deadline', 'Status', '']}>
            {jobs.map((job) => (
              <tr key={job._id} className="hover:bg-ink-50/60">
                <td className="td">
                  <Link href={`/jobs/${job._id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline">
                    {job.title}
                  </Link>
                  <div className="text-[13px] text-ink-400">
                    /careers/open-roles/{job.slug} · {job.openings} opening{job.openings > 1 ? 's' : ''} ·{' '}
                    {job.viewCount ?? 0} views
                  </div>
                </td>
                <td className="td">{job.department}</td>
                <td className="td">
                  {job.location}
                  <span className="ml-2 text-[13px] text-ink-400">{humanize(job.workMode)}</span>
                </td>
                <td className="td">{humanize(job.employmentType)}</td>
                <td className="td">
                  <Link
                    href={`/applications?job=${job._id}`}
                    className="font-medium text-brand-600 hover:underline"
                    title={`View the ${job.applicationCount ?? 0} candidate(s) who applied for ${job.title}`}
                  >
                    {job.applicationCount ?? 0}
                  </Link>
                </td>
                <td className="td">{date(job.deadline)}</td>
                <td className="td">
                  <StatusBadge status={job.status} />
                </td>
                <td className="td text-right">
                  <JobRowActions jobId={job._id} status={job.status} title={job.title} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <p className="mt-4 text-[13px] text-ink-400">
        <Badge tone="brand">Automation</Badge>{' '}
        <span className="ml-2">
          Jobs past their deadline are closed automatically each night; every published role emits{' '}
          <code className="rounded bg-ink-100 px-1 py-0.5">JobPosting</code> structured data for Google Jobs.
        </span>
      </p>
    </>
  );
}
