import Link from 'next/link';
import SubscribersTable, { type SubscriberRow } from '@/components/SubscribersTable';
import { Badge, Card, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Subscribers' };
export const dynamic = 'force-dynamic';

type Payload = { items: SubscriberRow[]; counts: Record<string, number> };

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; source?: string }>;
}) {
  const filters = await searchParams;

  const query = new URLSearchParams({ limit: '100' });
  if (filters.search) query.set('search', filters.search);
  if (filters.status) query.set('status', filters.status);
  if (filters.source) query.set('source', filters.source);

  const result = await apiFetch<Payload>(`/admin/subscribers?${query}`);
  const subscribers = result.ok ? result.data.items : [];
  const counts = result.ok ? result.data.counts : {};
  const total = result.ok ? (result.meta?.total ?? subscribers.length) : 0;
  const isFiltered = Boolean(filters.search || filters.status || filters.source);

  const confirmed = counts.confirmed ?? 0;
  const listSize = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const confirmedShare = listSize ? `${((confirmed / listSize) * 100).toFixed(1)}% of the list` : 'no signups yet';

  return (
    <>
      <PageHeader
        title="Newsletter subscribers"
        subtitle="The signup form asks for an email address only. Everything else here is captured automatically — where they signed up, when, and whether they confirmed."
        actions={
          <a href={`/api/proxy/admin/subscribers/export?${query}`} className="btn-ghost">
            Export CSV
          </a>
        }
      />

      {!result.ok && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200">
          {result.error}
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Confirmed" value={confirmed} hint={confirmedShare} />
        <StatCard label="Pending confirmation" value={counts.pending ?? 0} hint="double opt-in not completed" />
        <StatCard label="Unsubscribed" value={counts.unsubscribed ?? 0} hint="opted out" />
        <StatCard
          label="Bounced or complained"
          value={(counts.bounced ?? 0) + (counts.complained ?? 0)}
          hint="suppressed from sends"
        />
      </div>

      <Card padded={false}>
        {/* The table always renders, even with no rows: it owns the filter bar,
            and a filter that matches nothing must still be reachable to undo. */}
        <SubscribersTable
          rows={subscribers}
          empty={
            <EmptyState
              title={
                result.ok
                  ? isFiltered
                    ? 'No subscribers match these filters'
                    : 'No subscribers yet'
                  : 'Could not load subscribers'
              }
              hint={
                result.ok
                  ? isFiltered
                    ? 'Nobody matches what you picked above. Change a filter, or clear them to see every subscriber again.'
                    : 'Signups from the website land here as soon as someone subscribes and confirms.'
                  : 'Fix the error above and reload this page.'
              }
              action={
                result.ok && isFiltered ? (
                  <Link href="/newsletter" className="btn-primary mt-2">
                    Clear filters
                  </Link>
                ) : undefined
              }
            />
          }
        />

        {subscribers.length > 0 && (
          <div className="border-t border-ink-200 px-5 py-3.5 text-[15px] text-ink-500">
            Showing <span className="font-medium text-ink-700">{subscribers.length}</span>
            {!isFiltered && (
              <>
                {' '}of <span className="font-medium text-ink-700">{total}</span>
              </>
            )}
            {total > subscribers.length && (
              <span className="ml-1 text-ink-400">— narrow the list with the filters above to see the rest.</span>
            )}
          </div>
        )}
      </Card>

      <p className="mt-4 text-[13px] text-ink-400">
        <Badge tone="brand">Compliance</Badge>
        <span className="ml-2">
          Consent IP and timestamp are stored with every subscriber; every send carries an unsubscribe link and the
          registered postal address.
        </span>
      </p>
    </>
  );
}
