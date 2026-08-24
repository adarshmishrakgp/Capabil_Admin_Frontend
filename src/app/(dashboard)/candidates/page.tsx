import { Avatar, Card, PageHeader, Pagination, StatCard, Table, Toolbar } from '@/components/ui';
import { candidates } from '@/lib/data';

export const metadata = { title: 'Candidates' };

export default function CandidatesPage() {
  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle="Your talent pool — deduplicated by email, searchable across every application ever received."
        actions={<button className="btn-ghost">Export CSV</button>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total candidates" value="1,284" delta={9} hint="unique people" />
        <StatCard label="Repeat applicants" value={186} hint="applied to 2+ roles" />
        <StatCard label="Shortlist-ready" value={54} hint="rated 4★ and above" />
        <StatCard label="Do not contact" value={7} hint="opted out" />
      </div>

      <Card padded={false}>
        <Toolbar
          placeholder="Search by name, email, skill or resume text…"
          filters={[
            { label: 'Any experience', options: ['0–2 yrs', '2–5 yrs', '5–8 yrs', '8–12 yrs', '12+ yrs'] },
            { label: 'Any location', options: ['Bengaluru', 'Mumbai', 'Remote', 'Chennai'] },
          ]}
        >
          <button className="btn-ghost">Invite to apply</button>
        </Toolbar>
        <Table head={['Candidate', 'Contact', 'Location', 'Experience', 'Skills', 'Applications', 'Last applied', '']}>
          {candidates.map((c) => (
            <tr key={c.id} className="hover:bg-ink-50/60">
              <td className="td">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <span className="font-medium text-ink-900">{c.name}</span>
                </div>
              </td>
              <td className="td">
                <div>{c.email}</div>
                <div className="text-[13px] text-ink-400">{c.phone}</div>
              </td>
              <td className="td">{c.location}</td>
              <td className="td">{c.experience}</td>
              <td className="td">
                <div className="flex gap-1.5">
                  {c.skills.map((s) => (
                    <span key={s} className="rounded-lg bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                      {s}
                    </span>
                  ))}
                </div>
              </td>
              <td className="td">{c.applications}</td>
              <td className="td">{c.lastApplied}</td>
              <td className="td text-right">
                <button className="btn-subtle px-2 py-1 text-[13px]">Profile</button>
              </td>
            </tr>
          ))}
        </Table>
        <Pagination total={1284} limit={5} />
      </Card>

      <p className="mt-4 text-[13px] text-ink-400">
        Privacy: candidate records are retained for 24 months. Export-as-JSON and hard-delete are available on every
        profile to satisfy GDPR / DPDP requests.
      </p>
    </>
  );
}
