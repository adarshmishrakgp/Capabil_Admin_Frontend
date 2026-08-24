import { AreaChart } from '@/components/charts';
import { Badge, Card, PageHeader, Pagination, StatCard, StatusBadge, Table, Toolbar, humanize } from '@/components/ui';
import { subscribers, subscriberTrend } from '@/lib/data';

export const metadata = { title: 'Subscribers' };

export default function NewsletterPage() {
  return (
    <>
      <PageHeader
        title="Newsletter subscribers"
        subtitle="The signup form asks for an email address only. Everything else here is captured automatically — where they signed up, when, and whether they confirmed."
        actions={
          <>
            <button className="btn-ghost">Import CSV</button>
            <button className="btn-primary">Export CSV</button>
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Confirmed" value="2,674" delta={8} hint="94.1% of list" />
        <StatCard label="Pending confirmation" value={96} hint="purged after 14 days" />
        <StatCard label="Unsubscribed (30d)" value={11} delta={-3} hint="0.4% churn" />
        <StatCard label="Average open rate" value="41.2%" delta={5} hint="last 6 campaigns" />
      </div>

      <Card className="mb-4" title="List growth" description="Last 90 days">
        <AreaChart data={subscriberTrend} height={160} label="Newsletter subscriber growth" />
      </Card>

      <Card padded={false}>
        <Toolbar
          placeholder="Search by email or name…"
          filters={[
            { label: 'All statuses', options: ['confirmed', 'pending', 'unsubscribed', 'bounced', 'complained'] },
            { label: 'All sources', options: ['footer', 'blog_sidebar', 'article_cta', 'popup', 'import', 'manual'] },
            { label: 'All tags', options: ['insights', 'playbooks', 'bfsi'] },
          ]}
        >
          <button className="btn-ghost">Build segment</button>
        </Toolbar>
        <Table head={['', 'Email address', 'Signed up from', 'Tags', 'Signed up', 'Confirmed', 'Status', '']}>
          {subscribers.map((s) => (
            <tr key={s.id} className="hover:bg-ink-50/60">
              <td className="td w-10">
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600" />
              </td>
              <td className="td font-medium text-ink-900">{s.email}</td>
              <td className="td">{humanize(s.source)}</td>
              <td className="td">
                <div className="flex gap-1.5">
                  {s.tags.length === 0 && <span className="text-ink-400">—</span>}
                  {s.tags.map((t) => (
                    <span key={t} className="rounded-lg bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="td">{s.joinedOn}</td>
              <td className="td">
                {s.confirmedOn ?? <span className="text-ink-400">Not confirmed</span>}
              </td>
              <td className="td">
                <StatusBadge status={s.status} />
              </td>
              <td className="td text-right">
                <button className="btn-subtle px-2 py-1 text-[13px]">Tag</button>
                <button className="btn-subtle px-2 py-1 text-[13px] text-rose-600">Suppress</button>
              </td>
            </tr>
          ))}
        </Table>
        <Pagination total={2841} limit={6} />
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
