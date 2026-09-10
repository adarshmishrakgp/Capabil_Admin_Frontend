'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import CoverImageUpload, { type CoverImage, pickAndUploadImage } from './CoverImageUpload';
import CaseStudyPreview from './preview/CaseStudyPreview';
import PreviewShell from './preview/PreviewShell';
import RichTextEditor from './RichTextEditor';
import { Card, StatusBadge, cn } from './ui';
import { SITE_URL } from '@/lib/config';

export type CaseStudyResult = { label: string; value: string };

export type CaseStudyDraft = {
  _id?: string;
  title: string;
  slug?: string;
  client?: string;
  sector?: string;
  services?: string[];
  summary?: string;
  coverImage?: CoverImage | null;
  challenge?: string;
  response?: string;
  outcome?: string;
  results?: CaseStudyResult[];
  testimonial?: { quote?: string; authorName?: string; authorRole?: string };
  contentHtml?: string;
  status?: string;
  isFeatured?: boolean;
  order?: number;
  scheduledFor?: string;
  publishedAt?: string;
  readingTimeMinutes?: number;
  viewCount?: number;
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string; canonicalUrl?: string; noindex?: boolean };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);

/** A local datetime the <input type="datetime-local"> can round-trip. */
const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

/**
 * Mirrors the API's publish gate so the editor learns what is missing before a
 * round trip. The API stays the authority — this only saves a wasted request.
 */
const REQUIRED_TO_PUBLISH: [keyof CaseStudyDraft, string][] = [
  ['summary', 'Summary'],
  ['challenge', 'The challenge'],
  ['response', 'The response'],
  ['outcome', 'The outcome'],
];

const MAX_RESULTS = 6;

export default function CaseStudyForm({
  initial,
  caseStudyId,
  sectors,
}: {
  initial?: CaseStudyDraft;
  caseStudyId?: string;
  /** Sectors already in use, so the same one is not retyped three ways. */
  sectors: string[];
}) {
  const router = useRouter();

  const [study, setStudy] = useState<CaseStudyDraft>(() => ({
    title: '',
    client: '',
    sector: '',
    summary: '',
    challenge: '',
    response: '',
    outcome: '',
    contentHtml: '',
    isFeatured: false,
    order: 0,
    results: [],
    testimonial: {},
    seo: {},
    ...initial,
    services: initial?.services ?? [],
  }));

  // Only a brand-new study follows the title; renaming a published one must not
  // silently move its URL out from under everyone who has linked to it.
  const [slugLocked, setSlugLocked] = useState(Boolean(caseStudyId));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<null | 'draft' | 'published' | 'scheduled'>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(toLocalInput(initial?.scheduledFor));
  const [serviceDraft, setServiceDraft] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const set = <K extends keyof CaseStudyDraft>(key: K, value: CaseStudyDraft[K]) =>
    setStudy((current) => ({ ...current, [key]: value }));

  const slug = study.slug || slugify(study.title);
  const services = study.services ?? [];
  const results = study.results ?? [];

  const missingToPublish = useMemo(
    () => REQUIRED_TO_PUBLISH.filter(([field]) => !String(study[field] ?? '').trim()).map(([, label]) => label),
    [study],
  );

  /* ------------------------------- services ------------------------------- */

  function addService() {
    const name = serviceDraft.trim();
    // Case-insensitive so "GCC setup" and "GCC Setup" cannot both be added.
    if (!name || services.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setServiceDraft('');
      return;
    }
    set('services', [...services, name].slice(0, 12));
    setServiceDraft('');
  }

  const removeService = (name: string) =>
    set(
      'services',
      services.filter((s) => s !== name),
    );

  /* -------------------------------- results ------------------------------- */

  const addResult = () => set('results', [...results, { label: '', value: '' }].slice(0, MAX_RESULTS));

  const updateResult = (index: number, patch: Partial<CaseStudyResult>) =>
    set(
      'results',
      results.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const removeResult = (index: number) =>
    set(
      'results',
      results.filter((_, i) => i !== index),
    );

  /* --------------------------------- save --------------------------------- */

  async function save(intent: 'draft' | 'published' | 'scheduled') {
    if (pending !== null || coverUploading || inlineUploading) return;
    if (intent === 'scheduled' && !scheduleAt) {
      setError('Pick the date and time this case study should go live.');
      return;
    }
    if (intent !== 'draft' && missingToPublish.length) {
      setError(`Fill in ${missingToPublish.join(', ').toLowerCase()} before publishing.`);
      return;
    }

    setPending(intent);
    setError(null);
    setFieldErrors({});

    const testimonial = study.testimonial ?? {};
    const payload = {
      title: study.title.trim(),
      slug: slug || undefined,
      client: study.client?.trim() || undefined,
      sector: study.sector?.trim() || undefined,
      services,
      summary: study.summary?.trim() || undefined,
      // An omitted PATCH field leaves the saved image untouched. Null explicitly
      // clears it, so removing a cover also removes it from the public website.
      coverImage: study.coverImage?.url ? study.coverImage : null,
      challenge: study.challenge?.trim() ?? '',
      response: study.response?.trim() ?? '',
      outcome: study.outcome?.trim() ?? '',
      // Half-filled metric rows would render as empty cells on the public page.
      results: results.filter((row) => row.label.trim() && row.value.trim()),
      testimonial: testimonial.quote?.trim() ? testimonial : undefined,
      contentHtml: study.contentHtml ?? '',
      isFeatured: Boolean(study.isFeatured),
      order: Number(study.order) || 0,
      seo:
        study.seo && Object.values(study.seo).some((v) => v !== undefined && v !== '' && v !== false)
          ? study.seo
          : undefined,
    };

    try {
      const res = await fetch(
        caseStudyId ? `/api/proxy/admin/case-studies/${caseStudyId}` : '/api/proxy/admin/case-studies',
        {
          method: caseStudyId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (body?.error?.details) {
          setFieldErrors(
            Object.fromEntries(body.error.details.map((d: { field: string; issue: string }) => [d.field, d.issue])),
          );
        }
        setError(body?.error?.message ?? 'Could not save this case study');
        setPending(null);
        return;
      }

      // Content and status are separate endpoints: writing a study takes
      // case_studies:write, putting it in front of the public takes
      // case_studies:publish.
      const id = caseStudyId ?? body.data._id;
      if (intent !== 'draft') {
        const status = await fetch(`/api/proxy/admin/case-studies/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            intent === 'scheduled'
              ? { status: 'scheduled', scheduledFor: new Date(scheduleAt).toISOString() }
              : { status: 'published' },
          ),
        });
        if (!status.ok) {
          const statusBody = await status.json().catch(() => ({}));
          setError(statusBody?.error?.message ?? 'Saved as a draft, but the status change failed');
          setPending(null);
          return;
        }
      }

      router.push('/case-studies');
      router.refresh();
    } catch {
      setError('Network error — is the API running?');
      setPending(null);
    }
  }

  const invalid = (field: string) => (fieldErrors[field] ? 'border-rose-400 focus:border-rose-400' : '');
  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="mt-1 text-[13px] text-rose-600">{fieldErrors[field]}</p> : null;

  const busy = pending !== null || coverUploading || inlineUploading;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {caseStudyId ? 'Edit case study' : 'Write a case study'}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-ink-500">
            {caseStudyId && study.status ? (
              <>
                <StatusBadge status={study.status} />
                <span>{study.client || 'Anonymised client'}</span>
              </>
            ) : (
              <span>Nothing is public until you publish it.</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost" onClick={() => setPreviewOpen(true)}>
            Preview
          </button>
          <Link href="/case-studies" className="btn-ghost">
            Cancel
          </Link>
          <button className="btn-ghost" onClick={() => save('draft')} disabled={busy}>
            {pending === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            className="btn-primary"
            onClick={() => save('published')}
            disabled={busy || missingToPublish.length > 0}
            title={missingToPublish.length ? `Still needs: ${missingToPublish.join(', ')}` : undefined}
          >
            {pending === 'published' ? 'Publishing…' : study.status === 'published' ? 'Update live study' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          {error}
        </p>
      )}

      {caseStudyId && study.status && study.status !== 'published' && (
        <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-ink-50 px-4 py-3 text-[15px] text-ink-600 ring-1 ring-inset ring-ink-200">
          <span>
            This case study is <strong className="text-ink-900">{study.status.replace(/_/g, ' ')}</strong>, so it is not
            on capabiliq.com yet. Use <strong className="text-ink-900">Preview</strong> to see how it will look, then
            publish when you are happy with it.
          </span>
        </p>
      )}

      {missingToPublish.length > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-[15px] text-amber-800 ring-1 ring-inset ring-amber-200">
          Still needed before this can go live: <strong>{missingToPublish.join(', ')}</strong>. You can save a draft now
          and finish later.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="grid gap-4">
              <div>
                <label className="label" htmlFor="cs-title">
                  Title
                </label>
                <input
                  id="cs-title"
                  className={cn('field text-[17px] font-medium', invalid('title'))}
                  placeholder="e.g. From hiring backlog to a stable engineering pod"
                  value={study.title}
                  onChange={(event) => set('title', event.target.value)}
                />
                <FieldError field="title" />
              </div>

              <div>
                <label className="label" htmlFor="cs-slug">
                  URL
                </label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[13px] text-ink-400">/insights/case-studies/</span>
                  <input
                    id="cs-slug"
                    className={cn('field font-mono text-[13px]', invalid('slug'))}
                    placeholder="auto-generated-from-the-title"
                    value={slugLocked ? (study.slug ?? slug) : slug}
                    readOnly={!slugLocked}
                    onChange={(event) => set('slug', slugify(event.target.value))}
                  />
                  {!slugLocked && (
                    <button
                      type="button"
                      className="btn-subtle shrink-0 px-2 py-1 text-[13px]"
                      onClick={() => setSlugLocked(true)}
                    >
                      Edit
                    </button>
                  )}
                </div>
                <FieldError field="slug" />
                {caseStudyId && (
                  <p className="mt-1 text-[13px] text-amber-700">
                    Changing this breaks every existing link. Only do it before the study has been shared.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="cs-client">
                    Client
                  </label>
                  <input
                    id="cs-client"
                    className={cn('field', invalid('client'))}
                    placeholder="Leave blank to keep the client anonymous"
                    value={study.client ?? ''}
                    onChange={(event) => set('client', event.target.value)}
                  />
                  <p className="mt-1 text-[13px] text-ink-400">Only name a client you have written permission to name.</p>
                  <FieldError field="client" />
                </div>

                <div>
                  <label className="label" htmlFor="cs-sector">
                    Sector
                  </label>
                  <input
                    id="cs-sector"
                    className={cn('field', invalid('sector'))}
                    list="cs-sector-options"
                    placeholder="e.g. Healthcare operations"
                    value={study.sector ?? ''}
                    onChange={(event) => set('sector', event.target.value)}
                  />
                  <datalist id="cs-sector-options">
                    {sectors.map((value) => (
                      <option key={value} value={value} />
                    ))}
                  </datalist>
                  <p className="mt-1 text-[13px] text-ink-400">Drives the sector filter on the public index.</p>
                  <FieldError field="sector" />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="cs-summary">
                  Summary
                </label>
                <textarea
                  id="cs-summary"
                  className={cn('field h-20 resize-y', invalid('summary'))}
                  maxLength={320}
                  placeholder="The two lines that appear on the case study card and in search results."
                  value={study.summary ?? ''}
                  onChange={(event) => set('summary', event.target.value)}
                />
                <p className="mt-1 text-[13px] text-ink-400">{(study.summary ?? '').length}/320</p>
                <FieldError field="summary" />
              </div>
            </div>
          </Card>

          <Card
            title="The engagement"
            description="Three columns on the public page: what was in the way, what we did, what changed"
          >
            <div className="grid gap-4">
              {(
                [
                  ['challenge', 'The challenge', 'What was in the way? The constraint the client actually had.'],
                  ['response', 'The response', 'What Capabiliq did about it — the shape of the engagement.'],
                  ['outcome', 'The outcome', 'What changed. Concrete beats adjectives.'],
                ] as const
              ).map(([field, label, placeholder]) => (
                <div key={field}>
                  <label className="label" htmlFor={`cs-${field}`}>
                    {label}
                  </label>
                  <textarea
                    id={`cs-${field}`}
                    className={cn('field h-24 resize-y', invalid(field))}
                    placeholder={placeholder}
                    value={study[field] ?? ''}
                    onChange={(event) => set(field, event.target.value)}
                  />
                  <FieldError field={field} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Results" description="Headline numbers shown as a strip on the case study page">
            {results.length === 0 ? (
              <p className="text-[15px] text-ink-500">
                No results yet. A number a reader can hold on to does more than another paragraph.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {results.map((row, index) => (
                  <li key={index} className="flex flex-wrap items-start gap-2">
                    <input
                      className="field min-w-[180px] flex-1"
                      placeholder="Label — e.g. Time to first hire"
                      maxLength={80}
                      value={row.label}
                      onChange={(event) => updateResult(index, { label: event.target.value })}
                      aria-label={`Result ${index + 1} label`}
                    />
                    <input
                      className="field w-40"
                      placeholder="Value — e.g. 31 days"
                      maxLength={80}
                      value={row.value}
                      onChange={(event) => updateResult(index, { value: event.target.value })}
                      aria-label={`Result ${index + 1} value`}
                    />
                    <button
                      type="button"
                      className="btn-subtle px-2.5 py-2 text-[13px] text-rose-600"
                      onClick={() => removeResult(index)}
                      aria-label={`Remove result ${index + 1}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="btn-ghost mt-3"
              onClick={addResult}
              disabled={results.length >= MAX_RESULTS}
              title={results.length >= MAX_RESULTS ? `A strip holds at most ${MAX_RESULTS} numbers` : undefined}
            >
              + Add a result
            </button>
            <p className="mt-2 text-[13px] text-ink-400">
              Rows with an empty label or value are dropped on save. Up to {MAX_RESULTS}.
            </p>
          </Card>

          <Card title="Client quote" description="Optional — shown under the results when a quote is filled in">
            <div className="grid gap-4">
              <div>
                <label className="label" htmlFor="cs-quote">
                  Quote
                </label>
                <textarea
                  id="cs-quote"
                  className="field h-20 resize-y"
                  maxLength={600}
                  placeholder="What the client said about the work."
                  value={study.testimonial?.quote ?? ''}
                  onChange={(event) => set('testimonial', { ...study.testimonial, quote: event.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="cs-quote-name">
                    Who said it
                  </label>
                  <input
                    id="cs-quote-name"
                    className="field"
                    maxLength={120}
                    placeholder="Full name"
                    value={study.testimonial?.authorName ?? ''}
                    onChange={(event) => set('testimonial', { ...study.testimonial, authorName: event.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="cs-quote-role">
                    Their role
                  </label>
                  <input
                    id="cs-quote-role"
                    className="field"
                    maxLength={120}
                    placeholder="e.g. VP Engineering"
                    value={study.testimonial?.authorRole ?? ''}
                    onChange={(event) => set('testimonial', { ...study.testimonial, authorRole: event.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Full story" description="Optional long-form body; everything is sanitised on save">
            <RichTextEditor
              value={study.contentHtml ?? ''}
              onChange={(html) => set('contentHtml', html)}
              onInsertImage={async () => (await pickAndUploadImage())?.url ?? null}
              onUploadingChange={setInlineUploading}
              disabled={pending !== null}
            />
          </Card>

          <Card title="Search appearance" description="Overrides the site defaults for this case study">
            <div className="grid gap-4">
              <div>
                <label className="label" htmlFor="cs-seo-title">
                  Meta title
                </label>
                <input
                  id="cs-seo-title"
                  className="field"
                  placeholder={study.title ? `${study.title} | Capabiliq` : 'Case study title | Capabiliq'}
                  value={study.seo?.metaTitle ?? ''}
                  onChange={(event) => set('seo', { ...study.seo, metaTitle: event.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="cs-seo-description">
                  Meta description
                </label>
                <textarea
                  id="cs-seo-description"
                  className="field h-20"
                  maxLength={160}
                  placeholder={study.summary || 'A one-sentence summary for search results.'}
                  value={study.seo?.metaDescription ?? ''}
                  onChange={(event) => set('seo', { ...study.seo, metaDescription: event.target.value })}
                />
                <p className="mt-1 text-[13px] text-ink-400">{(study.seo?.metaDescription ?? '').length}/160</p>
              </div>
              <div>
                <label className="label" htmlFor="cs-seo-canonical">
                  Canonical URL
                </label>
                <input
                  id="cs-seo-canonical"
                  className="field"
                  placeholder="Only needed if this study was first published elsewhere"
                  value={study.seo?.canonicalUrl ?? ''}
                  onChange={(event) => set('seo', { ...study.seo, canonicalUrl: event.target.value })}
                />
              </div>
              <label className="flex items-start gap-2.5 text-[15px] text-ink-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={Boolean(study.seo?.noindex)}
                  onChange={(event) => set('seo', { ...study.seo, noindex: event.target.checked })}
                />
                <span>
                  Hide from search engines
                  <span className="block text-[13px] text-ink-400">
                    The study stays reachable by anyone with the link — useful for a client review.
                  </span>
                </span>
              </label>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Publishing">
            <div className="space-y-4">
              {caseStudyId && study.status && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
                  <span className="text-[13px] text-ink-500">Current status</span>
                  <StatusBadge status={study.status} />
                </div>
              )}

              <div>
                <label className="label" htmlFor="cs-schedule-at">
                  Schedule for later
                </label>
                <input
                  id="cs-schedule-at"
                  type="datetime-local"
                  className="field"
                  value={scheduleAt}
                  onChange={(event) => setScheduleAt(event.target.value)}
                />
                <button
                  type="button"
                  className="btn-ghost mt-2 w-full"
                  onClick={() => save('scheduled')}
                  disabled={busy || !scheduleAt || missingToPublish.length > 0}
                >
                  {pending === 'scheduled' ? 'Scheduling…' : 'Save & schedule'}
                </button>
                <p className="mt-1.5 text-[13px] text-ink-400">
                  Checked every five minutes — it goes live on its own, no one has to be at a desk.
                </p>
              </div>

              <label className="flex items-start gap-2.5 border-t border-ink-200 pt-4 text-[15px] text-ink-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={Boolean(study.isFeatured)}
                  onChange={(event) => set('isFeatured', event.target.checked)}
                />
                <span>
                  Feature this case study
                  <span className="block text-[13px] text-ink-400">
                    Runs as the cover story at the top of the index.
                  </span>
                </span>
              </label>

              <div className="border-t border-ink-200 pt-4">
                <label className="label" htmlFor="cs-order">
                  Running order
                </label>
                <input
                  id="cs-order"
                  type="number"
                  min={0}
                  max={999}
                  className="field"
                  value={study.order ?? 0}
                  onChange={(event) => set('order', Number(event.target.value))}
                />
                <p className="mt-1 text-[13px] text-ink-400">
                  Lower numbers come first. Leave everything at 0 to order by publish date.
                </p>
              </div>

              {study.status === 'published' && (
                <a
                  href={`${SITE_URL}/insights/case-studies/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost w-full"
                >
                  View live case study ↗
                </a>
              )}
            </div>
          </Card>

          <Card title="Cover image" description="Shown on the index card, the study header and social shares">
            <CoverImageUpload
              value={study.coverImage}
              onChange={(cover) => set('coverImage', cover)}
              onUploadingChange={setCoverUploading}
              disabled={pending !== null}
            />
          </Card>

          <Card title="Services" description="What the engagement involved">
            <div className="flex gap-2">
              <input
                className="field"
                placeholder="e.g. Contract staffing"
                maxLength={80}
                value={serviceDraft}
                onChange={(event) => setServiceDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addService();
                  }
                }}
                aria-label="Add a service"
              />
              <button type="button" className="btn-ghost shrink-0" onClick={addService} disabled={!serviceDraft.trim()}>
                Add
              </button>
            </div>

            {services.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {services.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => removeService(name)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1 text-[13px] font-medium text-white"
                    aria-label={`Remove ${name}`}
                    title="Remove"
                  >
                    {name}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-[13px] text-ink-400">Press Enter to add. Click a service to remove it.</p>
          </Card>

          {caseStudyId && (
            <Card title="Performance">
              <dl className="grid grid-cols-2 gap-3 text-[15px]">
                <div>
                  <dt className="text-[13px] text-ink-500">Reads</dt>
                  <dd className="text-xl font-semibold text-ink-900">
                    {(study.viewCount ?? 0).toLocaleString('en-GB')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-ink-500">Published</dt>
                  <dd className="font-medium text-ink-800">
                    {study.publishedAt
                      ? new Date(study.publishedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not yet'}
                  </dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
      </div>

      <PreviewShell
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={study.title.trim() || 'Untitled case study'}
        subtitle={`capabiliq.com/insights/case-studies/${slug || '…'}`}
      >
        <CaseStudyPreview study={{ ...study, services, results }} />
      </PreviewShell>
    </>
  );
}
