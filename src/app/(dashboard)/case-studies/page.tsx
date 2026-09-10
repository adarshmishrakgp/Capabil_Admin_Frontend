import Link from 'next/link';
import CaseStudyRowActions from '@/components/CaseStudyRowActions';
import CaseStudyToolbar from '@/components/CaseStudyToolbar';
import { Badge, Card, EmptyState, PageHeader, StatCard, StatusBadge, Table } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';
import { mediaUrl } from '@/lib/config';

export const metadata = { title: 'Case studies' };
export const dynamic = 'force-dynamic';

export type CaseStudyRow = {
  _id: string;
  title: string;
  slug: string;
  client?: string;
  sector?: string;
  services?: string[];
  summary?: string;
  coverImage?: { url?: string; key?: string; alt?: string } | null;
  results?: { label?: string; value?: string }[];
  status: string;
  isFeatured?: boolean;
  order?: number;
  readingTimeMinutes?: number;
  viewCount?: number;
  publishedAt?: string;
  scheduledFor?: string;
  updatedAt?: string;
  updatedBy?: { _id: string; name: string } | null;
};

const STATUSES = ['published', 'draft', 'in_review', 'scheduled', 'archived'];

const shortDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default async function CaseStudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sector?: string; status?: string }>;
}) {
  const { search, sector, status } = await searchParams;

  const query = new URLSearchParams({ limit: '100', sort: '-updatedAt' });
  if (search) query.set('search', search);
  if (sector) query.set('sector', sector);
  if (status) query.set('status', status);

  const [result, sectorResult, allResult] = await Promise.all([
    apiFetch<CaseStudyRow[]>(`/admin/case-studies?${query}`),
    apiFetch<string[]>('/admin/case-studies/sectors'),
    // The tiles describe the whole library, not the current filter — otherwise
    // filtering to "Draft" would report zero published studies.
    apiFetch<CaseStudyRow[]>('/admin/case-studies?limit=200&sort=-updatedAt'),
  ]);

  const studies = result.ok ? result.data : [];
  const sectors = sectorResult.ok ? sectorResult.data : [];
  const everything = allResult.ok ? allResult.data : studies;
  const isFiltered = Boolean(search || sector || status);

  const count = (value: string) => everything.filter((s) => s.status === value).length;
  const totalViews = everything.reduce((sum, s) => sum + (s.viewCount ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Case studies"
        subtitle="Client engagement stories. Published studies appear on capabiliq.com/insights/case-studies within a minute."
        actions={
          <Link href="/case-studies/new" className="btn-primary">
            + New case study
          </Link>
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

      {/*
        The single most common confusion: work is written, saved, and then not
        on the website — because saving and publishing are separate steps. Say
        so here rather than leaving the status badge to imply it.
      */}
      {result.ok && count('published') === 0 && everything.length > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-[15px] text-amber-800 ring-1 ring-inset ring-amber-200">
          <strong>Nothing is live on the website yet.</strong> You have{' '}
          {everything.length === 1 ? 'one case study' : `${everything.length} case studies`} saved, but only{' '}
          <em>published</em> studies appear at /insights/case-studies. Open one, use <strong>Preview</strong> to check
          it, then <strong>Publish</strong>.
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published" value={count('published')} hint="live on the website" />
        <StatCard label="Drafts" value={count('draft') + count('in_review')} hint="not visible publicly" />
        <StatCard label="Scheduled" value={count('scheduled')} hint="publish automatically" />
        <StatCard label="Total reads" value={totalViews.toLocaleString('en-GB')} hint="across all studies" />
      </div>

      <Card padded={false}>
        {/* The toolbar always renders, even with no rows: a filter that matches
            nothing must still be reachable to undo. */}
        <CaseStudyToolbar
          search={search}
          sector={sector}
          status={status}
          sectors={sectors}
          statuses={STATUSES}
        />

        {studies.length === 0 ? (
          <EmptyState
            title={
              !result.ok
                ? 'Could not load case studies'
                : isFiltered
                  ? 'Nothing matched those filters'
                  : 'No case studies yet'
            }
            hint={
              !result.ok
                ? 'Fix the error above and reload this page.'
                : isFiltered
                  ? 'Try a broader search, or clear the filters to see every case study.'
                  : 'Write up your first engagement — it stays a draft until you publish it.'
            }
            action={
              !result.ok ? undefined : isFiltered ? (
                <Link href="/case-studies" className="btn-ghost mt-2">
                  Clear filters
                </Link>
              ) : (
                <Link href="/case-studies/new" className="btn-primary mt-2">
                  + New case study
                </Link>
              )
            }
          />
        ) : (
          <Table head={['Case study', 'Client', 'Sector', 'Published', 'Reads', 'Status', '']}>
            {studies.map((study) => (
              <tr key={study._id} className="hover:bg-ink-50/60">
                <td className="td max-w-[420px] whitespace-normal">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100 bg-cover bg-center ring-1 ring-inset ring-ink-200"
                      style={
                        study.coverImage?.url
                          ? { backgroundImage: `url(${mediaUrl(study.coverImage.url, study.coverImage.key)})` }
                          : undefined
                      }
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <Link
                        href={`/case-studies/${study._id}/edit`}
                        className="font-medium text-ink-900 hover:text-brand-700 hover:underline"
                      >
                        {study.title}
                      </Link>
                      {study.isFeatured && (
                        <span className="ml-2 align-middle">
                          <Badge tone="pink">Featured</Badge>
                        </span>
                      )}
                      <span className="mt-0.5 block truncate text-[13px] text-ink-400">
                        /insights/case-studies/{study.slug}
                        {study.results?.length ? ` · ${study.results.length} result${study.results.length === 1 ? '' : 's'}` : ''}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="td">{study.client ?? <span className="text-ink-400">Anonymised</span>}</td>
                <td className="td">{study.sector ?? <span className="text-ink-400">—</span>}</td>
                <td className="td">
                  {study.status === 'scheduled' ? (
                    <span title="Publishes automatically">{shortDate(study.scheduledFor)}</span>
                  ) : (
                    shortDate(study.publishedAt)
                  )}
                </td>
                <td className="td">{(study.viewCount ?? 0).toLocaleString('en-GB')}</td>
                <td className="td">
                  <StatusBadge status={study.status} />
                </td>
                <td className="td text-right">
                  <CaseStudyRowActions
                    caseStudyId={study._id}
                    status={study.status}
                    title={study.title}
                    slug={study.slug}
                  />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <p className="mt-4 text-[13px] text-ink-400">
        <Badge tone="brand">Automation</Badge>{' '}
        <span className="ml-2">
          Scheduled studies go live on their own every five minutes, and publishing re-renders{' '}
          <code className="rounded bg-ink-100 px-1 py-0.5">/insights/case-studies</code> on the public site straight away.
        </span>
      </p>
    </>
  );
}
