import Link from 'next/link';
import CandidatesTable, { type CandidateRow } from '@/components/CandidatesTable';
import { Card, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Candidates' };
export const dynamic = 'force-dynamic';

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; skill?: string }>;
}) {
  const filters = await searchParams;

  const query = new URLSearchParams({ limit: '100', sort: '-lastAppliedAt' });
  if (filters.search) query.set('search', filters.search);
  if (filters.skill) query.set('skill', filters.skill);

  const list = await apiFetch<CandidateRow[]>(`/admin/candidates?${query}`);
  const candidates = list.ok ? list.data : [];
  const total = list.ok ? (list.meta?.total ?? candidates.length) : 0;
  const isFiltered = Boolean(filters.search || filters.skill);

  // Counted from the rows on screen, so the tiles always describe what is listed.
  const repeatApplicants = candidates.filter((c) => (c.applications?.length ?? 0) > 1).length;
  const doNotContact = candidates.filter((c) => c.doNotContact).length;
  const appliedThisMonth = candidates.filter(
    (c) => c.lastAppliedAt && Date.now() - new Date(c.lastAppliedAt).getTime() < 30 * 86_400_000,
  ).length;

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle="Your talent pool — one record per person, deduplicated by email across every application they have ever sent."
      />

      {!list.ok && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200">
          {list.error}
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isFiltered ? 'Matching this search' : 'Total candidates'}
          value={isFiltered ? candidates.length : total}
          hint="unique people"
        />
        <StatCard label="Applied in the last 30 days" value={appliedThisMonth} hint="of those listed" />
        <StatCard label="Repeat applicants" value={repeatApplicants} hint="applied to 2+ roles" />
        <StatCard label="Do not contact" value={doNotContact} hint="opted out" />
      </div>

      <Card padded={false}>
        {/* The table always renders, even with no rows: it owns the filter bar,
            and a filter that matches nothing must still be reachable to undo. */}
        <CandidatesTable
          rows={candidates}
          empty={
            <EmptyState
              title={
                list.ok
                  ? isFiltered
                    ? 'No candidates match that search'
                    : 'No candidates yet'
                  : 'Could not load candidates'
              }
              hint={
                list.ok
                  ? isFiltered
                    ? 'Nobody matches what you searched for. Try a different name, email, location or skill, or clear the search.'
                    : 'A candidate record is created the first time someone applies from the careers site.'
                  : 'Fix the error above and reload this page.'
              }
              action={
                !list.ok ? undefined : isFiltered ? (
                  <Link href="/candidates" className="btn-primary mt-2">
                    Clear search
                  </Link>
                ) : (
                  <Link href="/jobs" className="btn-primary mt-2">
                    Review open roles
                  </Link>
                )
              }
            />
          }
        />

        {candidates.length > 0 && (
          <div className="border-t border-ink-200 px-5 py-3.5 text-[15px] text-ink-500">
            Showing <span className="font-medium text-ink-700">{candidates.length}</span>
            {!isFiltered && (
              <>
                {' '}of <span className="font-medium text-ink-700">{total}</span>
              </>
            )}
            {total > candidates.length && (
              <span className="ml-1 text-ink-400">— narrow the list with the filters above to see the rest.</span>
            )}
          </div>
        )}
      </Card>

      <p className="mt-4 text-[13px] text-ink-400">
        Privacy: erasing a candidate also deletes every application they sent, which is what a GDPR / DPDP erasure
        request requires.
      </p>
    </>
  );
}
