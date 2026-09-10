import Link from 'next/link';
import LeadsTable, { type LeadRow } from '@/components/LeadsTable';
import { Card, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Leads' };
export const dynamic = 'force-dynamic';

const OPEN_STATUSES = ['new', 'contacted', 'qualified', 'proposal'];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; type?: string }>;
}) {
  const filters = await searchParams;

  const query = new URLSearchParams({ limit: '100' });
  if (filters.search) query.set('search', filters.search);
  if (filters.status) query.set('status', filters.status);
  if (filters.type) query.set('type', filters.type);

  const list = await apiFetch<LeadRow[]>(`/admin/leads?${query}`);
  const leads = list.ok ? list.data : [];
  const total = list.ok ? (list.meta?.total ?? leads.length) : 0;
  const isFiltered = Boolean(filters.search || filters.status || filters.type);

  const countOf = (...statuses: string[]) => leads.filter((lead) => statuses.includes(lead.status)).length;
  const overdue = leads.filter(
    (lead) => lead.followUpAt && new Date(lead.followUpAt) < new Date() && OPEN_STATUSES.includes(lead.status),
  ).length;

  return (
    <>
      <PageHeader
        title="Leads & enquiries"
        subtitle="Everyone who contacted us through the website. Assign an owner, move them along, and keep the follow-up dates honest."
      />

      {!list.ok && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200">
          {list.error}
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isFiltered ? 'Matching this filter' : 'Open enquiries'}
          value={isFiltered ? leads.length : countOf(...OPEN_STATUSES)}
          hint="not yet won or lost"
        />
        <StatCard label="New" value={countOf('new')} hint="nobody has replied yet" />
        <StatCard label="Qualified or in proposal" value={countOf('qualified', 'proposal')} hint="live opportunities" />
        <StatCard label="Follow-up overdue" value={overdue} hint="past the date set" />
      </div>

      <Card padded={false}>
        {/* The table always renders, even with no rows: it owns the filter bar,
            and a filter that matches nothing must still be reachable to undo. */}
        <LeadsTable
          rows={leads}
          empty={
            <EmptyState
              title={
                list.ok
                  ? isFiltered
                    ? 'No enquiries match these filters'
                    : 'No enquiries yet'
                  : 'Could not load leads'
              }
              hint={
                list.ok
                  ? isFiltered
                    ? 'Nobody matches what you picked above. Change a filter, or clear them to see every enquiry again.'
                    : 'Submissions from the website contact form land here the moment someone sends one.'
                  : 'Fix the error above and reload this page.'
              }
              action={
                list.ok && isFiltered ? (
                  <Link href="/leads" className="btn-primary mt-2">
                    Clear filters
                  </Link>
                ) : undefined
              }
            />
          }
        />

        {leads.length > 0 && (
          <div className="border-t border-ink-200 px-5 py-3.5 text-[15px] text-ink-500">
            Showing <span className="font-medium text-ink-700">{leads.length}</span>
            {!isFiltered && (
              <>
                {' '}of <span className="font-medium text-ink-700">{total}</span>
              </>
            )}
            {total > leads.length && (
              <span className="ml-1 text-ink-400">— narrow the list with the filters above to see the rest.</span>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
