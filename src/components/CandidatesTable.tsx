'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import CandidateProfile from './CandidateProfile';
import { Avatar, Badge, Table } from './ui';

export type CandidateRow = {
  _id: string;
  fullName?: string;
  email: string;
  phone?: string;
  location?: string;
  skills?: string[];
  totalExperienceYears?: number;
  applications?: string[];
  doNotContact?: boolean;
  firstAppliedAt?: string;
  lastAppliedAt?: string;
};

const day = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function CandidatesTable({ rows, empty }: {
  rows: CandidateRow[];
  /**
   * Shown in place of the table when nothing matches. It renders *below* the
   * toolbar on purpose: a filter that returns no rows must still leave the
   * controls on screen, or there is no way back out of it.
   */
  empty?: ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [viewing, setViewing] = useState<string | null>(null);

  /** Filters live in the URL, so a filtered view is shareable and survives a refresh. */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/candidates?${next.toString()}`);
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
            placeholder="Search by name, email or location…"
            defaultValue={params.get('search') ?? ''}
            onKeyDown={(e) => e.key === 'Enter' && setParam('search', (e.target as HTMLInputElement).value)}
          />
        </div>

        <input
          className="field w-auto min-w-[160px]"
          placeholder="Filter by skill…"
          defaultValue={params.get('skill') ?? ''}
          onKeyDown={(e) => e.key === 'Enter' && setParam('skill', (e.target as HTMLInputElement).value)}
        />

        {(params.get('search') || params.get('skill')) && (
          <button className="btn-subtle" onClick={() => router.push('/candidates')}>
            Clear filters
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        empty
      ) : (
        <Table head={['Candidate', 'Contact', 'Location', 'Experience', 'Skills', 'Applications', 'Last applied', '']}>
          {rows.map((c) => (
            <tr key={c._id} className="hover:bg-ink-50/60">
              <td className="td">
                <button className="flex items-center gap-3 text-left" onClick={() => setViewing(c._id)}>
                  <Avatar name={c.fullName ?? c.email} />
                  <span>
                    <span className="block font-medium text-ink-900 hover:text-brand-700 hover:underline">
                      {c.fullName ?? '—'}
                    </span>
                    {c.doNotContact && <Badge tone="red">Do not contact</Badge>}
                  </span>
                </button>
              </td>
              <td className="td">
                <div>{c.email}</div>
                <div className="text-[13px] text-ink-400">{c.phone ?? '—'}</div>
              </td>
              <td className="td">{c.location ?? '—'}</td>
              <td className="td">{c.totalExperienceYears != null ? `${c.totalExperienceYears} yrs` : '—'}</td>
              <td className="td">
                <div className="flex flex-wrap gap-1.5">
                  {(c.skills ?? []).slice(0, 4).map((s) => (
                    <span key={s} className="rounded-lg bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                      {s}
                    </span>
                  ))}
                  {(c.skills?.length ?? 0) > 4 && (
                    <span className="text-xs text-ink-400">+{(c.skills?.length ?? 0) - 4}</span>
                  )}
                  {(c.skills?.length ?? 0) === 0 && <span className="text-ink-400">—</span>}
                </div>
              </td>
              <td className="td">{c.applications?.length ?? 0}</td>
              <td className="td">{day(c.lastAppliedAt)}</td>
              <td className="td text-right">
                <button className="btn-ghost px-3 py-1.5 text-[13px]" onClick={() => setViewing(c._id)}>
                  Profile
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {viewing && <CandidateProfile candidateId={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
