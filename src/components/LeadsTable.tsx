'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Fragment, type ReactNode, useState } from 'react';
import { StatusBadge, Table, humanize } from './ui';

export type LeadRow = {
  _id: string;
  type: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  designation?: string;
  companySize?: string;
  interestArea?: string;
  message?: string;
  status: string;
  followUpAt?: string;
  createdAt: string;
  owner?: { _id?: string; name?: string };
  notes?: { body: string; at: string }[];
  meta?: { landingPage?: string; referrer?: string; utm?: { source?: string; campaign?: string } };
};

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const TYPES = ['contact', 'demo', 'partner', 'download', 'event', 'other'];

const day = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function LeadsTable({ rows, empty }: {
  rows: LeadRow[];
  /**
   * Shown in place of the table when nothing matches. It renders *below* the
   * toolbar on purpose: a filter that returns no rows must still leave the
   * controls on screen, or there is no way back out of it.
   */
  empty?: ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');

  /** Only one row is open at a time, so a half-written note must not follow you to the next lead. */
  function toggle(id: string) {
    setExpanded((current) => (current === id ? null : id));
    setNote('');
  }

  /** Filters live in the URL, so a filtered view is shareable and survives a refresh. */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/leads?${next.toString()}`);
  }

  async function update(id: string, patch: Record<string, unknown>) {
    setBusy(id);
    const res = await fetch(`/api/proxy/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? 'Could not update this lead');
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
            placeholder="Search by name, email or company…"
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

        <select className="field w-auto" value={params.get('type') ?? ''} onChange={(e) => setParam('type', e.target.value)}>
          <option value="">All types</option>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {humanize(type)}
            </option>
          ))}
        </select>

        {(params.get('search') || params.get('status') || params.get('type')) && (
          <button className="btn-subtle" onClick={() => router.push('/leads')}>
            Clear filters
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        empty
      ) : (
        <Table head={['Enquiry', 'Company', 'Looking for', 'Received', 'Follow-up', 'Status', '']}>
          {rows.map((lead) => (
            <Fragment key={lead._id}>
              <tr className="hover:bg-ink-50/60">
                <td className="td">
                  <button className="text-left" onClick={() => toggle(lead._id)}>
                    <span className="block font-medium text-ink-900 hover:text-brand-700 hover:underline">
                      {lead.name}
                    </span>
                    <span className="block text-[13px] text-ink-400">
                      {lead.email}
                      {lead.phone ? ` · ${lead.phone}` : ''}
                    </span>
                  </button>
                </td>
                <td className="td">
                  {lead.company ?? '—'}
                  {lead.companySize && <span className="block text-[13px] text-ink-400">{lead.companySize}</span>}
                </td>
                <td className="td">{lead.interestArea ?? humanize(lead.type)}</td>
                <td className="td">{day(lead.createdAt)}</td>
                <td className="td">
                  {lead.followUpAt ? (
                    <span
                      className={
                        new Date(lead.followUpAt) < new Date() && !['won', 'lost'].includes(lead.status)
                          ? 'text-rose-600'
                          : undefined
                      }
                    >
                      {day(lead.followUpAt)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="td">
                  <select
                    className="field w-auto py-1 text-[13px]"
                    value={lead.status}
                    disabled={busy !== null}
                    onChange={(e) => update(lead._id, { status: e.target.value })}
                    aria-label={`Status for ${lead.name}`}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanize(status)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="td text-right">
                  <button
                    className="btn-ghost px-3 py-1.5 text-[13px]"
                    onClick={() => toggle(lead._id)}
                  >
                    {expanded === lead._id ? 'Close' : 'Open'}
                  </button>
                </td>
              </tr>

              {expanded === lead._id && (
                <tr>
                  <td colSpan={7} className="bg-ink-50/60 px-5 py-5">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <h3 className="mb-2 text-[15px] font-semibold text-ink-800">What they wrote</h3>
                        <p className="whitespace-pre-wrap rounded-xl bg-white p-4 text-[15px] leading-relaxed text-ink-700 ring-1 ring-inset ring-ink-200">
                          {lead.message?.trim() || 'No message was included.'}
                        </p>

                        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                          {[
                            ['Enquiry type', humanize(lead.type)],
                            ['Designation', lead.designation ?? '—'],
                            ['Owner', lead.owner?.name ?? 'Unassigned'],
                            ['Came from', lead.meta?.landingPage ?? lead.meta?.referrer ?? '—'],
                            [
                              'Campaign',
                              [lead.meta?.utm?.source, lead.meta?.utm?.campaign].filter(Boolean).join(' · ') || '—',
                            ],
                            ['Status', <StatusBadge key="s" status={lead.status} />],
                          ].map(([label, value]) => (
                            <div key={String(label)}>
                              <dt className="text-[13px] uppercase tracking-wider text-ink-400">{label as string}</dt>
                              <dd className="mt-0.5 break-words text-[15px] text-ink-800">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      <div>
                        <h3 className="mb-2 text-[15px] font-semibold text-ink-800">Follow-up</h3>
                        <label className="label">Next follow-up date</label>
                        <input
                          type="date"
                          className="field"
                          defaultValue={lead.followUpAt?.slice(0, 10) ?? ''}
                          disabled={busy !== null}
                          onChange={(e) => e.target.value && update(lead._id, { followUpAt: e.target.value })}
                        />

                        <label className="label mt-4">Add a note</label>
                        <textarea
                          className="field h-24 resize-y"
                          placeholder="What was discussed, what happens next…"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                        <button
                          className="btn-primary mt-2"
                          disabled={busy !== null || !note.trim()}
                          onClick={async () => {
                            await update(lead._id, { note: note.trim() });
                            setNote('');
                          }}
                        >
                          Save note
                        </button>

                        <ul className="mt-4 space-y-2">
                          {(lead.notes ?? []).length === 0 && (
                            <li className="text-[15px] text-ink-400">No notes yet.</li>
                          )}
                          {(lead.notes ?? [])
                            .slice()
                            .reverse()
                            .map((entry, i) => (
                              <li key={i} className="rounded-xl bg-white p-3 text-[15px] ring-1 ring-inset ring-ink-200">
                                <p className="text-ink-800">{entry.body}</p>
                                <p className="mt-1 text-[13px] text-ink-400">{day(entry.at)}</p>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </Table>
      )}
    </>
  );
}
