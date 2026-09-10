import { Badge, Card, EmptyState, PageHeader, Table, humanize } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Audit log' };
export const dynamic = 'force-dynamic';

type Entry = {
  _id: string;
  actorName?: string;
  action: string;
  model?: string;
  docId?: string;
  summary?: string;
  ip?: string;
  createdAt: string;
};

const ACTIONS = ['create', 'update', 'delete', 'publish', 'export', 'login'];
const MODELS = ['Job', 'Application', 'Candidate', 'Post', 'Comment', 'Subscriber', 'Lead', 'User', 'Setting'];

const TONE: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'brand' | 'neutral'> = {
  create: 'green',
  update: 'amber',
  delete: 'red',
  publish: 'brand',
  export: 'blue',
  login: 'neutral',
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; action?: string; model?: string }>;
}) {
  const filters = await searchParams;

  const query = new URLSearchParams({ limit: '100' });
  if (filters.search) query.set('search', filters.search);
  if (filters.action) query.set('action', filters.action);
  if (filters.model) query.set('model', filters.model);

  const list = await apiFetch<Entry[]>(`/admin/audit-logs?${query}`);
  const entries = list.ok ? list.data : [];
  const total = list.ok ? (list.meta?.total ?? entries.length) : 0;

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Every write the panel makes, with who made it and when. Read-only, and visible to super admins only."
      />

      {!list.ok && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200">
          {list.error}
        </p>
      )}

      <Card padded={false}>
        {/* A plain GET form keeps this page a server component — no client JS for a read-only log. */}
        <form action="/audit" method="get" className="flex flex-wrap items-center gap-2 border-b border-ink-200 px-5 py-3.5">
          <input
            name="search"
            className="field min-w-[220px] flex-1"
            placeholder="Search the summary or who did it…"
            defaultValue={filters.search ?? ''}
          />
          <select name="action" className="field w-auto" defaultValue={filters.action ?? ''}>
            <option value="">All actions</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {humanize(action)}
              </option>
            ))}
          </select>
          <select name="model" className="field w-auto" defaultValue={filters.model ?? ''}>
            <option value="">All records</option>
            {MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-ghost">
            Filter
          </button>
        </form>

        {entries.length === 0 ? (
          <EmptyState
            title={list.ok ? 'Nothing recorded yet' : 'Could not load the audit log'}
            hint={
              list.ok
                ? 'Entries appear as soon as someone changes a job, an application or a setting.'
                : 'Only a super admin can read the audit log. Sign in with an account that has full access.'
            }
          />
        ) : (
          <Table head={['When', 'Who', 'Action', 'Record', 'What changed', 'From']}>
            {entries.map((entry) => (
              <tr key={entry._id} className="hover:bg-ink-50/60">
                <td className="td whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="td">{entry.actorName ?? 'System'}</td>
                <td className="td">
                  <Badge tone={TONE[entry.action] ?? 'neutral'}>{humanize(entry.action)}</Badge>
                </td>
                <td className="td">{entry.model ?? '—'}</td>
                <td className="td">{entry.summary ?? '—'}</td>
                <td className="td font-mono text-[13px] text-ink-400">{entry.ip ?? '—'}</td>
              </tr>
            ))}
          </Table>
        )}

        {entries.length > 0 && (
          <div className="border-t border-ink-200 px-5 py-3.5 text-[15px] text-ink-500">
            Showing <span className="font-medium text-ink-700">{entries.length}</span> of{' '}
            <span className="font-medium text-ink-700">{total}</span>
          </div>
        )}
      </Card>
    </>
  );
}
