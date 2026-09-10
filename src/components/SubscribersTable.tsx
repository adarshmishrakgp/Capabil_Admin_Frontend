'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { StatusBadge, Table, humanize } from './ui';

export type SubscriberRow = {
  _id: string;
  email: string;
  name?: string;
  status: string;
  source?: string;
  sourceUrl?: string;
  tags?: string[];
  createdAt: string;
  confirmedAt?: string;
};

const STATUSES = ['confirmed', 'pending', 'unsubscribed', 'bounced', 'complained'];
const SOURCES = ['footer', 'blog_sidebar', 'article_cta', 'popup', 'import', 'manual', 'event'];

const day = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function SubscribersTable({ rows, empty }: {
  rows: SubscriberRow[];
  /**
   * Shown in place of the table when nothing matches. It renders *below* the
   * toolbar on purpose: a filter that returns no rows must still leave the
   * controls on screen, or there is no way back out of it.
   */
  empty?: ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);

  /** Filters live in the URL, so a filtered view is shareable and survives a refresh. */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/newsletter?${next.toString()}`);
  }

  /** Suppressing someone stops every future send — the same effect as their own unsubscribe. */
  async function suppress(id: string, email: string) {
    if (!window.confirm(`Stop sending to ${email}? They stay on the list, marked as unsubscribed.`)) return;

    setBusy(id);
    const res = await fetch(`/api/proxy/admin/subscribers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'unsubscribed' }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? 'Could not update this subscriber');
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 px-5 py-3.5">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            className="field pl-8"
            placeholder="Search by email or name…"
            defaultValue={params.get('search') ?? ''}
            onKeyDown={(e) => e.key === 'Enter' && setParam('search', (e.target as HTMLInputElement).value)}
          />
        </div>

        <select className="field w-auto" value={params.get('status') ?? ''} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {humanize(status)}
            </option>
          ))}
        </select>

        <select className="field w-auto" value={params.get('source') ?? ''} onChange={(e) => setParam('source', e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map((source) => (
            <option key={source} value={source}>
              {humanize(source)}
            </option>
          ))}
        </select>

        {(params.get('search') || params.get('status') || params.get('source')) && (
          <button className="btn-subtle" onClick={() => router.push('/newsletter')}>
            Clear filters
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        empty
      ) : (
        <Table head={['Email address', 'Signed up from', 'Tags', 'Signed up', 'Confirmed', 'Status', '']}>
          {rows.map((s) => (
            <tr key={s._id} className="hover:bg-ink-50/60">
              <td className="td">
                <span className="font-medium text-ink-900">{s.email}</span>
                {s.name && <span className="block text-[13px] text-ink-400">{s.name}</span>}
              </td>
              <td className="td">{s.source ? humanize(s.source) : '—'}</td>
              <td className="td">
                <div className="flex flex-wrap gap-1.5">
                  {(s.tags ?? []).length === 0 && <span className="text-ink-400">—</span>}
                  {(s.tags ?? []).map((tag) => (
                    <span key={tag} className="rounded-lg bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="td">{day(s.createdAt) ?? '—'}</td>
              <td className="td">{day(s.confirmedAt) ?? <span className="text-ink-400">Not confirmed</span>}</td>
              <td className="td">
                <StatusBadge status={s.status} />
              </td>
              <td className="td text-right">
                {s.status !== 'unsubscribed' && (
                  <button
                    className="btn-subtle px-2 py-1 text-[13px] text-rose-600"
                    onClick={() => suppress(s._id, s.email)}
                    disabled={busy !== null}
                  >
                    {busy === s._id ? 'Saving…' : 'Suppress'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
