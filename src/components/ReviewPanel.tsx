'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StatusBadge, humanize } from './ui';

type Note = { _id?: string; body: string; at: string; author?: { name?: string } };
type HistoryEntry = { from?: string; to: string; at: string; reason?: string; by?: { name?: string } };

type Detail = {
  _id: string;
  reference: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  currentCompany?: string;
  currentDesignation?: string;
  totalExperienceYears?: number;
  noticePeriodDays?: number;
  expectedCtc?: number;
  currentCtc?: number;
  currency?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  source?: string;
  rating: number;
  status: string;
  tags?: string[];
  createdAt: string;
  resume?: { key?: string; filename?: string };
  job?: { title: string; slug: string };
  notes?: Note[];
  statusHistory?: HistoryEntry[];
  meta?: { utm?: { source?: string; medium?: string; campaign?: string } };
};

/** The decisions a recruiter actually makes, as one-click outcomes. */
const OUTCOMES: { label: string; status: string; tone: string }[] = [
  { label: 'Shortlist', status: 'shortlisted', tone: 'bg-sky-50 text-sky-700 hover:bg-sky-100 ring-sky-200' },
  { label: 'Call for interview', status: 'interview', tone: 'bg-brand-50 text-brand-700 hover:bg-brand-100 ring-brand-200' },
  { label: 'Select', status: 'selected', tone: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-emerald-200' },
  { label: 'Hold', status: 'on_hold', tone: 'bg-amber-50 text-amber-700 hover:bg-amber-100 ring-amber-200' },
  { label: 'Not selected', status: 'rejected', tone: 'bg-rose-50 text-rose-700 hover:bg-rose-100 ring-rose-200' },
];

const money = (value?: number, currency = 'INR') =>
  value ? `${currency} ${value.toLocaleString('en-IN')}` : '—';

const when = (value?: string) =>
  value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function ReviewPanel({ applicationId, onClose }: { applicationId: string; onClose: () => void }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/proxy/admin/applications/${applicationId}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body?.error?.message ?? 'Could not load this application');
      return;
    }
    setDetail(body.data.application);
  }

  useEffect(() => {
    load();
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function call(label: string, path: string, init: RequestInit) {
    setBusy(label);
    const res = await fetch(`/api/proxy/admin/applications/${applicationId}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? `Could not ${label.toLowerCase()}`);
    }
    setBusy(null);
    await load();
    router.refresh();
  }

  const setOutcome = (label: string, status: string, notify: boolean) =>
    call(label, '/status', { method: 'PATCH', body: JSON.stringify({ status, reason: remark || undefined, notify }) });

  const addRemark = async () => {
    if (!remark.trim()) return;
    await call('Add remark', '/notes', { method: 'POST', body: JSON.stringify({ body: remark.trim() }) });
    setRemark('');
  };

  const setRating = (rating: number) =>
    call('Rate', '', { method: 'PATCH', body: JSON.stringify({ rating }) });

  const openResume = async () => {
    setBusy('Resume');
    const res = await fetch(`/api/proxy/admin/applications/${applicationId}/resume-url`);
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return alert(body?.error?.message ?? 'No resume available');
    window.open(body.data.url, '_blank', 'noopener');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/30 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="scrollbar-thin h-full w-full max-w-2xl overflow-y-auto bg-white shadow-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Application review"
      >
        {error && <p className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700">{error}</p>}

        {!detail && !error && <p className="p-6 text-[15px] text-ink-500">Loading…</p>}

        {detail && (
          <>
            {/* header */}
            <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-ink-900">{detail.fullName}</h2>
                  <p className="mt-1 text-[15px] text-ink-500">
                    {detail.currentDesignation ?? '—'}
                    {detail.currentCompany ? ` at ${detail.currentCompany}` : ''} · applied for{' '}
                    <span className="font-medium text-ink-700">{detail.job?.title}</span>
                  </p>
                  <p className="mt-1 font-mono text-[13px] text-ink-400">{detail.reference}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.status} />
                  <button className="btn-subtle h-9 w-9 p-0 text-lg" onClick={onClose} aria-label="Close">
                    ×
                  </button>
                </div>
              </div>

              {/* the decision row */}
              <div className="mt-4 flex flex-wrap gap-2">
                {OUTCOMES.filter((o) => o.status !== detail.status).map((o) => (
                  <button
                    key={o.status}
                    onClick={() => setOutcome(o.label, o.status, o.status === 'interview' || o.status === 'rejected')}
                    disabled={busy !== null}
                    className={`rounded-xl px-3 py-2 text-[14px] font-medium ring-1 ring-inset transition-colors ${o.tone}`}
                  >
                    {busy === o.label ? '…' : o.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-ink-400">
                “Call for interview” and “Not selected” email the candidate. The others are internal only.
              </p>
            </header>

            <div className="space-y-6 px-6 py-5">
              {/* contact + facts */}
              <section className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Email', <a key="e" href={`mailto:${detail.email}`} className="text-brand-600 hover:underline">{detail.email}</a>],
                  ['Phone', detail.phone ? <a key="p" href={`tel:${detail.phone.replace(/\s+/g, '')}`} className="text-brand-600 hover:underline">{detail.phone}</a> : '—'],
                  ['Location', detail.location ?? '—'],
                  ['Experience', detail.totalExperienceYears != null ? `${detail.totalExperienceYears} years` : '—'],
                  ['Notice period', detail.noticePeriodDays != null ? `${detail.noticePeriodDays} days` : '—'],
                  ['Expected CTC', money(detail.expectedCtc, detail.currency)],
                  ['Applied on', when(detail.createdAt)],
                  ['Heard about us', detail.source ?? (detail.meta?.utm?.source ?? '—')],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-[13px] uppercase tracking-wider text-ink-400">{label}</p>
                    <p className="mt-0.5 text-[15px] text-ink-800">{value}</p>
                  </div>
                ))}
              </section>

              <section className="flex flex-wrap items-center gap-3 border-y border-ink-200 py-4">
                <button className="btn-ghost" onClick={openResume} disabled={busy !== null || !detail.resume?.key}>
                  {busy === 'Resume' ? 'Opening…' : `Resume${detail.resume?.filename ? ` · ${detail.resume.filename}` : ''}`}
                </button>
                {detail.linkedinUrl && (
                  <a href={detail.linkedinUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                    LinkedIn ↗
                  </a>
                )}
                {detail.portfolioUrl && (
                  <a href={detail.portfolioUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                    Portfolio ↗
                  </a>
                )}

                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[13px] text-ink-500">Rating</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n === detail.rating ? 0 : n)}
                      disabled={busy !== null}
                      className={`text-xl leading-none transition-colors ${
                        n <= (detail.rating ?? 0) ? 'text-amber-500' : 'text-ink-200 hover:text-amber-300'
                      }`}
                      aria-label={`Rate ${n} out of 5`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </section>

              {detail.coverLetter && (
                <section>
                  <h3 className="mb-2 text-[15px] font-semibold text-ink-800">Cover letter</h3>
                  <p className="whitespace-pre-wrap rounded-xl bg-ink-50 p-4 text-[15px] leading-relaxed text-ink-700">
                    {detail.coverLetter}
                  </p>
                </section>
              )}

              {/* remarks */}
              <section>
                <h3 className="mb-2 text-[15px] font-semibold text-ink-800">Remarks</h3>
                <textarea
                  className="field h-24 resize-y"
                  placeholder="Interview feedback, salary discussion, why they were held back…"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[13px] text-ink-400">
                    Internal only — never shown to the candidate. Typing here before an outcome above records it as the reason.
                  </p>
                  <button className="btn-primary" onClick={addRemark} disabled={busy !== null || !remark.trim()}>
                    {busy === 'Add remark' ? 'Saving…' : 'Add remark'}
                  </button>
                </div>

                <ul className="mt-4 space-y-3">
                  {(detail.notes ?? []).length === 0 && (
                    <li className="text-[15px] text-ink-400">No remarks yet.</li>
                  )}
                  {(detail.notes ?? [])
                    .slice()
                    .reverse()
                    .map((note, i) => (
                      <li key={note._id ?? i} className="rounded-xl border border-ink-200 p-3.5">
                        <p className="text-[15px] text-ink-800">{note.body}</p>
                        <p className="mt-1 text-[13px] text-ink-400">
                          {note.author?.name ?? 'Someone'} · {when(note.at)}
                        </p>
                      </li>
                    ))}
                </ul>
              </section>

              {/* audit trail for this candidate */}
              <section>
                <h3 className="mb-2 text-[15px] font-semibold text-ink-800">Pipeline history</h3>
                <ol className="space-y-2">
                  {(detail.statusHistory ?? []).map((entry, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2 text-[15px] text-ink-600">
                      <span className="text-ink-400">{when(entry.at)}</span>
                      {entry.from && <span>{humanize(entry.from)} →</span>}
                      <StatusBadge status={entry.to} />
                      {entry.by?.name && <span className="text-ink-400">by {entry.by.name}</span>}
                      {entry.reason && <span className="text-ink-500">· {entry.reason}</span>}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
