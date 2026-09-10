'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Avatar, Badge, StatusBadge } from './ui';

type Application = {
  _id: string;
  reference: string;
  status: string;
  createdAt: string;
  rating?: number;
  totalExperienceYears?: number;
  job?: { title?: string; slug?: string };
};

type Candidate = {
  _id: string;
  fullName?: string;
  email: string;
  phone?: string;
  location?: string;
  skills?: string[];
  totalExperienceYears?: number;
  doNotContact?: boolean;
  firstAppliedAt?: string;
  lastAppliedAt?: string;
  latestResume?: { key?: string; filename?: string; uploadedAt?: string };
  tags?: string[];
  applications?: Application[];
};

const when = (value?: string) =>
  value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/**
 * One person and everything they have applied for. The applications link
 * through to the full record, so this stays a summary rather than a second
 * place that has to render every field.
 */
export default function CandidateProfile({
  candidateId,
  onClose,
}: {
  candidateId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/proxy/admin/candidates/${candidateId}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body?.error?.message ?? 'Could not load this candidate');
      return;
    }
    setCandidate(body.data);
  }, [candidateId]);

  useEffect(() => {
    load();
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [load, onClose]);

  /** GDPR / DPDP erasure — removes the person and every application they made. */
  async function erase() {
    if (!candidate) return;
    const confirmed = window.confirm(
      `Permanently erase ${candidate.fullName ?? candidate.email} and all ${
        candidate.applications?.length ?? 0
      } of their applications? This cannot be undone.`,
    );
    if (!confirmed) return;

    setBusy(true);
    const res = await fetch(`/api/proxy/admin/candidates/${candidateId}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? 'Could not erase this candidate');
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/30 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="scrollbar-thin h-full w-full max-w-xl overflow-y-auto bg-white shadow-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Candidate profile"
      >
        {error && <p className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700">{error}</p>}
        {!candidate && !error && <p className="p-6 text-[15px] text-ink-500">Loading…</p>}

        {candidate && (
          <>
            <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={candidate.fullName ?? candidate.email} size={44} />
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-ink-900">
                      {candidate.fullName ?? '—'}
                    </h2>
                    <p className="mt-0.5 text-[15px] text-ink-500">
                      <a href={`mailto:${candidate.email}`} className="text-brand-600 hover:underline">
                        {candidate.email}
                      </a>
                      {candidate.phone ? ` · ${candidate.phone}` : ''}
                    </p>
                  </div>
                </div>
                <button className="btn-subtle h-9 w-9 p-0 text-lg" onClick={onClose} aria-label="Close">
                  ×
                </button>
              </div>
              {candidate.doNotContact && (
                <p className="mt-3">
                  <Badge tone="red">Do not contact — this person opted out</Badge>
                </p>
              )}
            </header>

            <div className="space-y-6 px-6 py-5">
              <section className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Location', candidate.location ?? '—'],
                  [
                    'Experience',
                    candidate.totalExperienceYears != null ? `${candidate.totalExperienceYears} years` : '—',
                  ],
                  ['First applied', when(candidate.firstAppliedAt)],
                  ['Last applied', when(candidate.lastAppliedAt)],
                  ['Latest resume', candidate.latestResume?.filename ?? '—'],
                  ['Applications', String(candidate.applications?.length ?? 0)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[13px] uppercase tracking-wider text-ink-400">{label}</p>
                    <p className="mt-0.5 break-words text-[15px] text-ink-800">{value}</p>
                  </div>
                ))}
              </section>

              {(candidate.skills?.length ?? 0) > 0 && (
                <section>
                  <h3 className="mb-2 text-[15px] font-semibold text-ink-800">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills?.map((skill) => (
                      <span key={skill} className="rounded-lg bg-ink-100 px-2.5 py-1 text-[13px] text-ink-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-[15px] font-semibold text-ink-800">Applications</h3>
                <ul className="space-y-2">
                  {(candidate.applications ?? []).length === 0 && (
                    <li className="text-[15px] text-ink-400">No applications on record.</li>
                  )}
                  {(candidate.applications ?? []).map((application) => (
                    <li
                      key={application._id}
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 px-3.5 py-2.5 text-[15px]"
                    >
                      <Link
                        href={`/applications/${application._id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {application.job?.title ?? 'Role removed'}
                      </Link>
                      <span className="font-mono text-[13px] text-ink-400">{application.reference}</span>
                      <StatusBadge status={application.status} />
                      <span className="ml-auto text-[13px] text-ink-400">{when(application.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-t border-ink-200 pt-4">
                <h3 className="mb-1.5 text-[15px] font-semibold text-ink-800">Erasure request</h3>
                <p className="mb-3 text-[13px] text-ink-400">
                  Deletes this person and every application they sent. Use it only for a GDPR / DPDP erasure request —
                  it cannot be undone.
                </p>
                <button className="btn-ghost text-rose-600" onClick={erase} disabled={busy}>
                  {busy ? 'Erasing…' : 'Erase this candidate'}
                </button>
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
