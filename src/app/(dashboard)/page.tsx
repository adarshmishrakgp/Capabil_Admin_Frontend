import Link from 'next/link';
import { AreaChart, BarList, Funnel } from '@/components/charts';
import { Avatar, Badge, Card, PageHeader, StatCard, StatusBadge } from '@/components/ui';
import { applicationTrend, applications, pipeline, subscriberTrend, topJobs } from '@/lib/data';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Here is what moved across careers, content and audience in the last 30 days."
        actions={
          <>
            <Link href="/jobs/new" className="btn-primary">
              Post a job
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={3} delta={12} hint="vs last month" href="/jobs" />
        <StatCard label="New applications (7d)" value={41} delta={26} hint="vs previous 7d" href="/applications" />
        <StatCard label="Newsletter subscribers" value="2,841" delta={8} hint="94% confirmed" href="/newsletter" />
        <StatCard label="Candidates in pool" value="1,284" delta={9} hint="unique people" href="/candidates" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Applications received"
          description="Last 30 days · 412 total"
          action={<Badge tone="brand">+26% MoM</Badge>}
        >
          <AreaChart data={applicationTrend} label="Applications received per day, last 30 days" />
        </Card>

        <Card title="Recruitment pipeline" description="Across all open roles">
          <Funnel stages={pipeline} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Applications by role" description="Top 5 openings">
          <BarList items={topJobs.map((j) => ({ label: j.job, value: j.count }))} />
        </Card>

        <Card
          title="Subscriber growth"
          description="Last 90 days"
          action={
            <Link href="/newsletter" className="text-[13px] font-medium text-brand-600 hover:underline">
              Manage list
            </Link>
          }
        >
          <AreaChart data={subscriberTrend} height={150} label="Newsletter subscribers per week" />
          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-200 pt-4 text-center">
            {[
              ['Confirmed', '2,674'],
              ['Pending', '96'],
              ['Unsubscribed', '71'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wider text-ink-400">{k}</dt>
                <dd className="mt-0.5 text-lg font-semibold text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
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
          <ul className="divide-y divide-ink-100">
            {applications.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={a.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink-800">{a.name}</p>
                  <p className="truncate text-[13px] text-ink-500">
                    {a.job} · {a.experience}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </Card>

      </div>
    </>
  );
}
