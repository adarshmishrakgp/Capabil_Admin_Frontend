'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import ReviewPanel from './ReviewPanel';
import { Avatar, StatusBadge, Table } from './ui';

export type Row = {
  _id: string;
  reference: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  currentDesignation?: string;
  totalExperienceYears?: number;
  rating: number;
  status: string;
  createdAt: string;
  resume?: { key?: string };
  job?: { _id: string; title: string };
};

const STATUSES = ['new', 'under_review', 'shortlisted', 'interview', 'selected', 'hired', 'on_hold', 'rejected'];

export default function ApplicationsTable({
  rows,
  roles,
  empty,
}: {
  rows: Row[];
  roles: { _id: string; title: string }[];
  /**
   * Shown in place of the table when nothing matches. It renders *below* the
   * toolbar on purpose: a filter that returns no rows must still leave the
   * controls on screen, or there is no way back out of it.
   */
  empty?: ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  /** Filters live in the URL, so a filtered view is shareable and survives a refresh. */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/applications?${next.toString()}`);
  }

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = rows.length > 0 && selected.size === rows.length;

  async function bulkStatus(status: string) {
    if (!selected.size) return;
    setBusy(true);
    const res = await fetch('/api/proxy/admin/applications/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected], status }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? 'Could not update those applications');
    }
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      {/* toolbar */}
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
            placeholder="Search name, email or phone…"
            defaultValue={params.get('search') ?? ''}
            onKeyDown={(e) => e.key === 'Enter' && setParam('search', (e.target as HTMLInputElement).value)}
          />
        </div>

        <select className="field w-auto" value={params.get('job') ?? ''} onChange={(e) => setParam('job', e.target.value)}>
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.title}
            </option>
          ))}
        </select>

        <select className="field w-auto" value={params.get('status') ?? ''} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>

        {(params.get('job') || params.get('status') || params.get('search')) && (
          <button className="btn-subtle" onClick={() => router.push('/applications')}>
            Clear filters
          </button>
        )}
      </div>

      {/* bulk bar — only when something is selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 bg-brand-50 px-5 py-3">
          <span className="text-[15px] font-medium text-brand-800">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => bulkStatus('shortlisted')} disabled={busy}>
              Shortlist
            </button>
            <button className="btn-ghost" onClick={() => bulkStatus('interview')} disabled={busy}>
              Call for interview
            </button>
            <button className="btn-ghost" onClick={() => bulkStatus('on_hold')} disabled={busy}>
              Hold
            </button>
            <button className="btn-ghost text-rose-600" onClick={() => bulkStatus('rejected')} disabled={busy}>
              Not selected
            </button>
            <button className="btn-subtle" onClick={() => setSelected(new Set())}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        empty
      ) : (
        <Table head={['', 'Candidate', 'Applied for', 'Experience', 'Rating', 'Applied on', 'Status', '']}>
          {rows.map((a) => (
            <tr key={a._id} className={selected.has(a._id) ? 'bg-brand-50/50' : 'hover:bg-ink-50/60'}>
              <td className="td w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selected.has(a._id)}
                  onChange={() => toggle(a._id)}
                  aria-label={`Select ${a.fullName}`}
                />
              </td>
              <td className="td">
                <button className="flex items-center gap-3 text-left" onClick={() => setReviewing(a._id)}>
                  <Avatar name={a.fullName} />
                  <span>
                    <span className="block font-medium text-ink-900 hover:text-brand-700 hover:underline">
                      {a.fullName}
                    </span>
                    <span className="block text-[13px] text-ink-400">
                      {a.email}
                      {a.phone ? ` · ${a.phone}` : ''}
                    </span>
                    <span className="block font-mono text-[13px] text-ink-400">{a.reference}</span>
                  </span>
                </button>
              </td>
              <td className="td">{a.job?.title ?? '—'}</td>
              <td className="td">{a.totalExperienceYears != null ? `${a.totalExperienceYears} yrs` : '—'}</td>
              <td className="td">
                <span className="text-[15px] text-amber-500">
                  {'★'.repeat(a.rating ?? 0)}
                  <span className="text-ink-200">{'★'.repeat(5 - (a.rating ?? 0))}</span>
                </span>
              </td>
              <td className="td">{new Date(a.createdAt).toISOString().slice(0, 10)}</td>
              <td className="td">
                <StatusBadge status={a.status} />
              </td>
              <td className="td text-right">
                <button className="btn-ghost px-3 py-1.5 text-[13px]" onClick={() => setReviewing(a._id)}>
                  Review
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {reviewing && <ReviewPanel applicationId={reviewing} onClose={() => setReviewing(null)} />}
    </>
  );
}
