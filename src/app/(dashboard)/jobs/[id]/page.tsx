import Link from 'next/link';
import { Funnel } from '@/components/charts';
import JobDeadlineControl from '@/components/JobDeadlineControl';
import JobRowActions from '@/components/JobRowActions';
import { Avatar, Badge, Card, PageHeader, StatCard, StatusBadge, Table, humanize } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

type Job = {
  _id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  workMode: string;
  employmentType: string;
  experienceMin?: number;
  experienceMax?: number;
  openings: number;
  shortDescription?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  status: string;
  deadline?: string;
  publishedAt?: string;
  createdAt: string;
  viewCount: number;
  salary?: { min?: number; max?: number; currency?: string; isPublic?: boolean };
  hiringManager?: { name?: string; email?: string };
  seo?: { metaTitle?: string; metaDescription?: string };
};

type Applicant = {
  _id: string;
  reference: string;
  fullName: string;
  email: string;
  status: string;
  rating: number;
  totalExperienceYears?: number;
  createdAt: string;
};

type Payload = {
  job: Job;
  stats: {
    totalApplications: number;
    thisWeek: number;
    views: number;
    conversionRate: number | null;
    pipeline: Record<string, number>;
    daysLeft: number | null;
    isExpired: boolean;
  };
  recentApplications: Applicant[];
};

const STAGES: [string, string][] = [
  ['new', 'New'],
  ['under_review', 'Under Review'],
  ['shortlisted', 'Shortlisted'],
  ['interview', 'Interview'],
  ['selected', 'Selected'],
  ['hired', 'Hired'],
];

const day = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await apiFetch<Payload>(`/admin/jobs/${id}`);
  return { title: result.ok ? result.data.job.title : 'Job' };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await apiFetch<Payload>(`/admin/jobs/${id}`);

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Job" />
        <Card>
          <p className="text-[15px] text-ink-600">{result.error}</p>
          <Link href="/jobs" className="btn-ghost mt-4">
            Back to jobs
          </Link>
        </Card>
      </>
    );
  }

  const { job, stats, recentApplications } = result.data;
  const salary =
    job.salary?.min && job.salary?.max
      ? `${job.salary.currency ?? 'INR'} ${job.salary.min.toLocaleString('en-IN')} – ${job.salary.max.toLocaleString('en-IN')}`
      : 'Not specified';

  return (
    <>
      <PageHeader
        title={job.title}
        subtitle={`${job.department} · ${job.location} · ${humanize(job.workMode)} · ${humanize(job.employmentType)}`}
        actions={
          <>
            <Link href="/jobs" className="btn-ghost">
              All jobs
            </Link>
            {job.status === 'published' && (
              <a
                href={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://capabiliq.com'}/careers/${job.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                View public page ↗
              </a>
            )}
            <Link href={`/jobs/${job._id}/edit`} className="btn-primary">
              Edit job
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={job.status} />
        <span className="text-[15px] text-ink-500">
          {job.openings} opening{job.openings === 1 ? '' : 's'} ·{' '}
          {job.experienceMin != null ? `${job.experienceMin}–${job.experienceMax} yrs` : 'any experience'} · posted{' '}
          {day(job.publishedAt ?? job.createdAt)}
        </span>
        <span className="ml-auto">
          <JobRowActions jobId={job._id} status={job.status} title={job.title} />
        </span>
      </div>

      {/* recruitment statistics */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total applications"
          value={stats.totalApplications}
          hint={`${stats.thisWeek} in the last 7 days`}
          href={`/applications?job=${job._id}`}
        />
        <StatCard label="Page views" value={stats.views} hint="on the public job page" />
        <StatCard
          label="Apply rate"
          value={stats.conversionRate != null ? `${stats.conversionRate}%` : '—'}
          hint="viewers who applied"
        />
        <StatCard
          label="Shortlisted"
          value={(stats.pipeline.shortlisted ?? 0) + (stats.pipeline.interview ?? 0)}
          hint="shortlisted or interviewing"
          href={`/applications?job=${job._id}&status=shortlisted`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Job description">
            {job.shortDescription && (
              <p className="mb-4 border-l-2 border-brand-300 pl-4 text-[15px] italic text-ink-600">
                {job.shortDescription}
              </p>
            )}

            {job.description ? (
              <div
                className="space-y-3 text-[15px] leading-relaxed text-ink-700 [&_a]:text-brand-600 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-900 [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-ink-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : (
              <p className="text-[15px] text-ink-400">
                No description yet.{' '}
                <Link href={`/jobs/${job._id}/edit`} className="text-brand-600 hover:underline">
                  Add one
                </Link>{' '}
                — it is what candidates read on the careers page.
              </p>
            )}

            {[
              ['Responsibilities', job.responsibilities],
              ['Requirements', job.requirements],
              ['Benefits', job.benefits],
            ].map(([heading, items]) =>
              (items as string[] | undefined)?.length ? (
                <section key={heading as string} className="mt-5">
                  <h3 className="mb-2 text-[15px] font-semibold text-ink-900">{heading as string}</h3>
                  <ul className="space-y-1.5">
                    {(items as string[]).map((item) => (
                      <li key={item} className="ml-5 list-disc text-[15px] text-ink-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}

            {job.skills?.length ? (
              <section className="mt-5 border-t border-ink-200 pt-4">
                <h3 className="mb-2 text-[15px] font-semibold text-ink-900">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span key={skill} className="rounded-lg bg-brand-50 px-2 py-1 text-[13px] font-medium text-brand-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </Card>

          <Card
            title="Recent applicants"
            description={`${stats.totalApplications} in total`}
            padded={false}
            action={
              <Link href={`/applications?job=${job._id}`} className="text-[13px] font-medium text-brand-600 hover:underline">
                View all candidates
              </Link>
            }
          >
            {recentApplications.length === 0 ? (
              <p className="px-5 py-8 text-center text-[15px] text-ink-400">
                No applications yet. {job.status !== 'published' && 'This role is not live on the careers page.'}
              </p>
            ) : (
              <Table head={['Candidate', 'Experience', 'Rating', 'Applied', 'Status']}>
                {recentApplications.map((a) => (
                  <tr key={a._id} className="hover:bg-ink-50/60">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.fullName} />
                        <div>
                          <div className="font-medium text-ink-900">{a.fullName}</div>
                          <div className="font-mono text-[13px] text-ink-400">{a.reference}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td">{a.totalExperienceYears != null ? `${a.totalExperienceYears} yrs` : '—'}</td>
                    <td className="td">
                      <span className="text-[15px] text-amber-500">
                        {'★'.repeat(a.rating ?? 0)}
                        <span className="text-ink-200">{'★'.repeat(5 - (a.rating ?? 0))}</span>
                      </span>
                    </td>
                    <td className="td">{day(a.createdAt)}</td>
                    <td className="td">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Application deadline" description="Extend it without opening the editor">
            <JobDeadlineControl
              jobId={job._id}
              deadline={job.deadline}
              daysLeft={stats.daysLeft}
              status={job.status}
            />
          </Card>

          <Card title="Pipeline" description="Where this role's candidates are">
            {stats.totalApplications === 0 ? (
              <p className="text-[15px] text-ink-400">Nothing to show until someone applies.</p>
            ) : (
              <Funnel stages={STAGES.map(([key, stage]) => ({ stage, count: stats.pipeline[key] ?? 0 }))} />
            )}
            {(stats.pipeline.rejected || stats.pipeline.on_hold) && (
              <p className="mt-4 border-t border-ink-200 pt-3 text-[13px] text-ink-500">
                {stats.pipeline.rejected ?? 0} not selected · {stats.pipeline.on_hold ?? 0} on hold
              </p>
            )}
          </Card>

          <Card title="Details">
            <dl className="space-y-3">
              {[
                ['Compensation', job.salary?.isPublic ? `${salary} (public)` : `${salary} (internal)`],
                ['Hiring manager', job.hiringManager?.name ?? 'Unassigned'],
                ['Public URL', `/careers/${job.slug}`],
                ['Created', day(job.createdAt)],
                ['Published', job.publishedAt ? day(job.publishedAt) : 'Not published'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-[13px] uppercase tracking-wider text-ink-400">{label}</dt>
                  <dd className="text-right text-[15px] text-ink-800">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Search visibility">
            <p className="text-[15px] text-ink-600">
              {job.status === 'published' ? (
                <>
                  <Badge tone="green">Live</Badge> This role emits <code className="rounded bg-ink-100 px-1">JobPosting</code>{' '}
                  structured data, so Google Jobs can index it.
                </>
              ) : (
                <>
                  <Badge tone="amber">Not indexed</Badge> Only published roles appear on the careers page and in search.
                </>
              )}
            </p>
            {job.seo?.metaTitle && <p className="mt-3 text-[13px] text-ink-500">Meta title: {job.seo.metaTitle}</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
