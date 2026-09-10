'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Badge, StatusBadge, humanize } from './ui';

type Note = { _id?: string; body: string; at: string; author?: { name?: string } };
type HistoryEntry = { from?: string; to: string; at: string; reason?: string; by?: { name?: string } };

export type ApplicationDetail = {
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
  isDuplicate?: boolean;
  consentGivenAt?: string;
  createdAt: string;
  updatedAt?: string;
  resume?: { key?: string; filename?: string; size?: number; mimeType?: string };
  job?: { _id?: string; title: string; slug: string; department?: string };
  candidate?: string;
  notes?: Note[];
  statusHistory?: HistoryEntry[];
  meta?: {
    ip?: string;
    userAgent?: string;
    country?: string;
    referrer?: string;
    landingPage?: string;
    utm?: { source?: string; medium?: string; campaign?: string; term?: string; content?: string };
  };
};

type OtherApplication = {
  _id: string;
  reference: string;
  status: string;
  createdAt: string;
  job?: { title?: string };
};

/** The decisions a recruiter actually makes, as one-click outcomes. */
const OUTCOMES: { label: string; status: string; tone: string }[] = [
  { label: 'Shortlist', status: 'shortlisted', tone: 'bg-sky-50 text-sky-700 hover:bg-sky-100 ring-sky-200' },
  { label: 'Call for interview', status: 'interview', tone: 'bg-brand-50 text-brand-700 hover:bg-brand-100 ring-brand-200' },
  { label: 'Select', status: 'selected', tone: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-emerald-200' },
  { label: 'Mark as hired', status: 'hired', tone: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-emerald-200' },
  { label: 'Hold', status: 'on_hold', tone: 'bg-amber-50 text-amber-700 hover:bg-amber-100 ring-amber-200' },
  { label: 'Not selected', status: 'rejected', tone: 'bg-rose-50 text-rose-700 hover:bg-rose-100 ring-rose-200' },
];

const money = (value?: number, currency = 'INR') =>
  value != null && value !== 0 ? `${currency} ${value.toLocaleString('en-IN')}` : '—';

const when = (value?: string) =>
  value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const fileSize = (bytes?: number) =>
  bytes ? (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`) : '';

const dash = (value?: string | number | null) =>
  value === undefined || value === null || value === '' ? '—' : String(value);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium leading-6 text-ink-800">{children}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-ink-900">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Everything stored about one application, and every action a recruiter can take
 * on it. Rendered both in the drawer on the applications table and as the
 * standalone /applications/[id] page the alert emails link to, so a reviewer
 * sees exactly the same record either way.
 */
export default function ApplicationDetailView({
  applicationId,
  onClose,
}: {
  applicationId: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [others, setOthers] = useState<OtherApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => () => {
    if (resumeUrl) URL.revokeObjectURL(resumeUrl);
  }, [resumeUrl]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/proxy/admin/applications/${applicationId}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? 'Could not load this application');
        return;
      }
      setDetail(body.data.application);
      setOthers(body.data.otherApplications ?? []);
      setError(null);
    } catch {
      setError('Could not load this application. Please close and reopen it to try again.');
    }
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function call(label: string, path: string, init: RequestInit) {
    setBusy(label);
    setActionError(null);
    try {
      const res = await fetch(`/api/proxy/admin/applications/${applicationId}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Could not ${label.toLowerCase()}`);
      }
      await load();
      router.refresh();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save changes. Please try again.');
      return false;
    } finally {
      setBusy(null);
    }
  }

  const setOutcome = (label: string, status: string, notify: boolean) =>
    call(label, '/status', { method: 'PATCH', body: JSON.stringify({ status, reason: remark || undefined, notify }) });

  const addRemark = async () => {
    if (!remark.trim()) return;
    if (await call('Add remark', '/notes', { method: 'POST', body: JSON.stringify({ body: remark.trim() }) })) setRemark('');
  };

  const setRating = (rating: number) => call('Rate', '', { method: 'PATCH', body: JSON.stringify({ rating }) });

  const saveTags = async (tags: string[]) => call('Update tags', '', { method: 'PATCH', body: JSON.stringify({ tags }) });

  const addTag = async () => {
    const tag = tagDraft.trim().slice(0, 40);
    if (!tag || !detail) return;
    const tags = detail.tags ?? [];
    if (tags.includes(tag)) return setTagDraft('');
    if (await saveTags([...tags, tag])) setTagDraft('');
  };

  const openResume = async () => {
    setBusy('Resume');
    setActionError(null);
    setResumeUrl(null);
    try {
      const res = await fetch('/api/resumes/' + applicationId);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'No resume available');
      }
      const bytes = await res.arrayBuffer();
      setResumeUrl(URL.createObjectURL(new Blob([bytes], { type: detail?.resume?.mimeType ?? 'application/pdf' })));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not open the resume. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (error) {
    return <p className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700">{error}</p>;
  }
  if (!detail) {
    return <p className="p-6 text-[15px] text-ink-500">Loading…</p>;
  }

  const utm = detail.meta?.utm ?? {};
  const hasUtm = Object.values(utm).some(Boolean);

  return (
    <>
      {/* header */}
      <header className="border-b border-ink-200 bg-white px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-700">Application review</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">{detail.fullName}</h2>
            <p className="mt-1 text-[15px] text-ink-500">
              {detail.currentDesignation ?? '—'}
              {detail.currentCompany ? ` at ${detail.currentCompany}` : ''} · applied for{' '}
              {detail.job?._id ? (
                <Link href={`/jobs/${detail.job._id}`} className="font-medium text-brand-700 hover:underline">
                  {detail.job.title}
                </Link>
              ) : (
                <span className="font-medium text-ink-700">{detail.job?.title ?? '—'}</span>
              )}
            </p>
            <p className="mt-1 font-mono text-[13px] text-ink-500">{detail.reference}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <StatusBadge status={detail.status} />
            {onClose && (
              <button className="btn-subtle h-9 w-9 p-0 text-lg" onClick={onClose} aria-label="Close">
                ×
              </button>
            )}
          </div>
        </div>

        {detail.isDuplicate && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[14px] text-amber-800 ring-1 ring-inset ring-amber-200">
            This person applied for this role again within 90 days — check the earlier submission before deciding.
          </p>
        )}

        {/* the decision row */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OUTCOMES.filter((o) => o.status !== detail.status).map((o) => (
            <button
              key={o.status}
              onClick={() => setOutcome(o.label, o.status, o.status === 'interview' || o.status === 'rejected')}
              disabled={busy !== null}
              className={`rounded-xl px-3 py-2 text-[14px] font-medium ring-1 ring-inset transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${o.tone}`}
            >
              {busy === o.label ? '…' : o.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-ink-500">
          “Call for interview” and “Not selected” email the candidate. The others are internal only.
        </p>
      </header>

      <div className="space-y-4 bg-ink-50 px-4 py-5 sm:px-7">
        {/* resume, links, rating */}
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <button className="btn-primary max-w-full break-all text-left" onClick={openResume} disabled={busy !== null || !detail.resume?.key}>
            {busy === 'Resume'
              ? 'Opening…'
              : detail.resume?.key
                ? `Resume${detail.resume.filename ? ` · ${detail.resume.filename}` : ''}${
                    fileSize(detail.resume.size) ? ` (${fileSize(detail.resume.size)})` : ''
                  }`
                : 'No resume attached'}
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

        {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
        {resumeUrl && (
          <Section title="Resume preview">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-600">{detail.resume?.filename}</p>
              <div className="flex gap-2">
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">Open resume</a>
                <a href={resumeUrl} download={detail.resume?.filename ?? 'resume'} className="btn-primary">Download</a>
              </div>
            </div>
            {detail.resume?.mimeType === 'application/pdf' || detail.resume?.filename?.toLowerCase().endsWith('.pdf') ? (
              <iframe title="Candidate resume PDF" src={resumeUrl} className="h-[560px] w-full rounded-xl border border-ink-200 bg-ink-50" />
            ) : <p className="text-sm text-ink-600">Open the Word document using the download link above.</p>}
            <p className="mt-2 text-xs text-ink-500">Private document · available only to authorized reviewers.</p>
          </Section>
        )}
        {/* contact + facts */}
        <Section title="Candidate">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Email">
              <a href={`mailto:${detail.email}`} className="text-brand-600 hover:underline">
                {detail.email}
              </a>
            </Field>
            <Field label="Phone">
              {detail.phone ? (
                <a href={`tel:${detail.phone.replace(/\s+/g, '')}`} className="text-brand-600 hover:underline">
                  {detail.phone}
                </a>
              ) : (
                '—'
              )}
            </Field>
            <Field label="Location">{dash(detail.location)}</Field>
            <Field label="Current company">{dash(detail.currentCompany)}</Field>
            <Field label="Current designation">{dash(detail.currentDesignation)}</Field>
            <Field label="Total experience">
              {detail.totalExperienceYears != null ? `${detail.totalExperienceYears} years` : '—'}
            </Field>
            <Field label="Notice period">
              {detail.noticePeriodDays != null ? `${detail.noticePeriodDays} days` : '—'}
            </Field>
            <Field label="Current CTC">{money(detail.currentCtc, detail.currency)}</Field>
            <Field label="Expected CTC">{money(detail.expectedCtc, detail.currency)}</Field>
            <Field label="Heard about us">{dash(detail.source ?? utm.source)}</Field>
            <Field label="Applied on">{when(detail.createdAt)}</Field>
            <Field label="Last updated">{when(detail.updatedAt)}</Field>
            <Field label="Role department">{dash(detail.job?.department)}</Field>
            <Field label="Consent given">{when(detail.consentGivenAt)}</Field>
          </div>
        </Section>

        {/* tags */}
        <Section title="Tags">
          <div className="flex flex-wrap items-center gap-2">
            {(detail.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[14px] text-ink-700"
              >
                {tag}
                <button
                  onClick={() => saveTags((detail.tags ?? []).filter((t) => t !== tag))}
                  disabled={busy !== null}
                  className="text-ink-500 hover:text-rose-600"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              aria-label="Add a tag" className="field w-auto min-w-[160px] flex-1"
              placeholder="Add a tag and press Enter…"
              maxLength={40}
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
          </div>
        </Section>

        {detail.coverLetter && (
          <Section title="Cover letter">
            <p className="whitespace-pre-wrap rounded-xl bg-ink-50 p-4 text-[15px] leading-relaxed text-ink-700">
              {detail.coverLetter}
            </p>
          </Section>
        )}

        {/* remarks */}
        <Section title="Remarks">
          <textarea
            aria-label="Internal remark" className="field h-24 resize-y"
            placeholder="Interview feedback, salary discussion, why they were held back…"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-ink-500">
              Internal only — never shown to the candidate. Typing here before an outcome above records it as the reason.
            </p>
            <button className="btn-primary shrink-0" onClick={addRemark} disabled={busy !== null || !remark.trim()}>
              {busy === 'Add remark' ? 'Saving…' : 'Add remark'}
            </button>
          </div>

          <ul className="mt-4 space-y-3">
            {(detail.notes ?? []).length === 0 && <li className="text-[15px] text-ink-500">No remarks yet.</li>}
            {(detail.notes ?? [])
              .slice()
              .reverse()
              .map((note, i) => (
                <li key={note._id ?? i} className="rounded-xl border border-ink-200 p-3.5">
                  <p className="whitespace-pre-wrap text-[15px] text-ink-800">{note.body}</p>
                  <p className="mt-1 text-[13px] text-ink-500">
                    {note.author?.name ?? 'Someone'} · {when(note.at)}
                  </p>
                </li>
              ))}
          </ul>
        </Section>

        {/* audit trail for this candidate */}
        <Section title="Pipeline history">
          <ol className="space-y-2">
            {(detail.statusHistory ?? []).length === 0 && (
              <li className="text-[15px] text-ink-500">Nothing recorded yet.</li>
            )}
            {(detail.statusHistory ?? []).map((entry, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 text-[15px] text-ink-600">
                <span className="text-ink-500">{when(entry.at)}</span>
                {entry.from && <span>{humanize(entry.from)} →</span>}
                <StatusBadge status={entry.to} />
                {entry.by?.name && <span className="text-ink-500">by {entry.by.name}</span>}
                {entry.reason && <span className="text-ink-500">· {entry.reason}</span>}
              </li>
            ))}
          </ol>
        </Section>

        {/* the same person, other roles */}
        {others.length > 0 && (
          <Section title={`Other applications from ${detail.email}`}>
            <ul className="space-y-2">
              {others.map((other) => (
                <li
                  key={other._id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 px-3.5 py-2.5 text-[15px]"
                >
                  <Link href={`/applications/${other._id}`} className="font-medium text-brand-700 hover:underline">
                    {other.job?.title ?? 'Role removed'}
                  </Link>
                  <span className="font-mono text-[13px] text-ink-500">{other.reference}</span>
                  <StatusBadge status={other.status} />
                  <span className="ml-auto text-[13px] text-ink-500">{when(other.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* provenance — where the submission came from */}
        <Section title="Submission details">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Applied from page">{dash(detail.meta?.landingPage)}</Field>
            <Field label="Referrer">{dash(detail.meta?.referrer)}</Field>
            <Field label="IP address">{dash(detail.meta?.ip)}</Field>
            <Field label="Country">{dash(detail.meta?.country)}</Field>
            <Field label="Campaign">
              {hasUtm
                ? [utm.source, utm.medium, utm.campaign, utm.term, utm.content].filter(Boolean).join(' · ')
                : '—'}
            </Field>
            <Field label="Resume file">
              {detail.resume?.filename
                ? `${detail.resume.filename}${fileSize(detail.resume.size) ? ` · ${fileSize(detail.resume.size)}` : ''}`
                : '—'}
            </Field>
          </div>
          <p className="mt-3 break-all text-[13px] text-ink-500">
            {detail.meta?.userAgent ? `Device: ${detail.meta.userAgent}` : 'Device: —'}
          </p>
          {detail.isDuplicate && (
            <p className="mt-3">
              <Badge tone="amber">Flagged as a repeat application</Badge>
            </p>
          )}
        </Section>
      </div>
    </>
  );
}
