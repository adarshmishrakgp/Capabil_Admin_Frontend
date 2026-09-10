'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from './ui';

export type JobDraft = {
  _id?: string;
  title: string;
  slug?: string;
  department: string;
  location: string;
  workMode: 'onsite' | 'hybrid' | 'remote';
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'consultant';
  experienceMin: number;
  experienceMax: number;
  openings: number;
  shortDescription: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  deadline?: string;
  status?: string;
  salary?: { min?: number; max?: number; currency?: string; isPublic?: boolean };
  seo?: { metaTitle?: string; metaDescription?: string };
};

const EMPTY: JobDraft = {
  title: '',
  department: 'Engineering',
  location: '',
  workMode: 'onsite',
  employmentType: 'full_time',
  experienceMin: 0,
  experienceMax: 2,
  openings: 1,
  shortDescription: '',
  description: '',
  responsibilities: [],
  requirements: [],
  benefits: [],
  skills: [],
  salary: { currency: 'INR', isPublic: false },
  seo: {},
};

const DEPARTMENTS = ['Engineering', 'Delivery', 'Sales', 'Marketing', 'HR', 'Operations'];
const TYPES: [JobDraft['employmentType'], string][] = [
  ['full_time', 'Full-time'],
  ['part_time', 'Part-time'],
  ['contract', 'Contract'],
  ['internship', 'Internship'],
  ['consultant', 'Consultant'],
];
const BANDS: [number, number, string][] = [
  [0, 2, '0–2 years'],
  [2, 5, '2–5 years'],
  [5, 8, '5–8 years'],
  [8, 12, '8–12 years'],
  [12, 20, '12+ years'],
];

/**
 * A bulleted section of the job ad, edited as one point per line — the shape
 * recruiters already write these in. It is deliberately uncontrolled: the lines
 * are parsed into an array on blur, so typing never fights the split/join.
 * Defined at module level so a re-render elsewhere in the form cannot remount it
 * and discard text the recruiter has not blurred out of yet.
 */
function BulletField({
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string[];
  onChange: (points: string[]) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="field h-32 resize-y"
        placeholder={placeholder}
        defaultValue={value.join('\n')}
        onBlur={(e) =>
          onChange(
            e.target.value
              .split('\n')
              .map((line) => line.replace(/^[-*•]\s*/, '').trim())
              .filter(Boolean),
          )
        }
      />
      <p className="mt-1 text-[13px] text-ink-400">
        {hint} · {value.length} {value.length === 1 ? 'point' : 'points'}
      </p>
    </div>
  );
}

export default function JobForm({ initial, jobId }: { initial?: JobDraft; jobId?: string }) {
  const router = useRouter();
  // An older job saved before these fields existed comes back without them —
  // spreading `initial` over EMPTY would then set them to undefined.
  const [job, setJob] = useState<JobDraft>(() => ({
    ...EMPTY,
    ...initial,
    responsibilities: initial?.responsibilities ?? [],
    requirements: initial?.requirements ?? [],
    benefits: initial?.benefits ?? [],
    skills: initial?.skills ?? [],
  }));
  const [skillDraft, setSkillDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<null | 'draft' | 'published'>(null);

  const set = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) =>
    setJob((current) => ({ ...current, [key]: value }));

  /* ------------------------------- skills ------------------------------- */

  function addSkill(raw: string) {
    // one paste can carry several: "React Native, Flutter, Kotlin"
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;

    setJob((current) => {
      const existing = new Set(current.skills.map((s) => s.toLowerCase()));
      const added = parts.filter((p) => !existing.has(p.toLowerCase()));
      return { ...current, skills: [...current.skills, ...added] };
    });
    setSkillDraft('');
  }

  function onSkillKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill(skillDraft);
    } else if (event.key === 'Backspace' && !skillDraft && job.skills.length) {
      set('skills', job.skills.slice(0, -1));
    }
  }

  /* -------------------------------- save -------------------------------- */

  async function save(status: 'draft' | 'published') {
    setPending(status);
    setError(null);
    setFieldErrors({});

    const payload = {
      title: job.title.trim(),
      department: job.department,
      location: job.location.trim(),
      workMode: job.workMode,
      employmentType: job.employmentType,
      experienceMin: Number(job.experienceMin),
      experienceMax: Number(job.experienceMax),
      openings: Number(job.openings),
      shortDescription: job.shortDescription || undefined,
      description: job.description || undefined,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      benefits: job.benefits,
      skills: job.skills,
      deadline: job.deadline || undefined,
      salary:
        job.salary?.min || job.salary?.max
          ? {
              min: Number(job.salary.min ?? 0),
              max: Number(job.salary.max ?? 0),
              currency: job.salary.currency ?? 'INR',
              isPublic: Boolean(job.salary.isPublic),
            }
          : undefined,
      seo: job.seo?.metaTitle || job.seo?.metaDescription ? job.seo : undefined,
    };

    try {
      const res = await fetch(jobId ? `/api/proxy/admin/jobs/${jobId}` : '/api/proxy/admin/jobs', {
        method: jobId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (body?.error?.details) {
          setFieldErrors(
            Object.fromEntries(body.error.details.map((d: { field: string; issue: string }) => [d.field, d.issue])),
          );
        }
        setError(body?.error?.message ?? 'Could not save this job');
        setPending(null);
        return;
      }

      // A new job is created as a draft; publishing is a second, explicit step.
      const id = jobId ?? body.data._id;
      if (status === 'published') {
        const publish = await fetch(`/api/proxy/admin/jobs/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        });
        if (!publish.ok) {
          const pb = await publish.json().catch(() => ({}));
          setError(pb?.error?.message ?? 'Saved, but publishing failed');
          setPending(null);
          return;
        }
      }

      router.push('/jobs');
      router.refresh();
    } catch {
      setError('Network error — is the API running?');
      setPending(null);
    }
  }

  const invalid = (field: string) => (fieldErrors[field] ? 'border-rose-400 focus:border-rose-400' : '');
  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="mt-1 text-[13px] text-rose-600">{fieldErrors[field]}</p> : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {jobId ? 'Edit job' : 'Post a job'}
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Draft now, publish when you are ready — nothing goes live until you say so.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/jobs" className="btn-ghost">
            Cancel
          </Link>
          <button className="btn-ghost" onClick={() => save('draft')} disabled={pending !== null}>
            {pending === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
          <button className="btn-primary" onClick={() => save('published')} disabled={pending !== null}>
            {pending === 'published' ? 'Publishing…' : 'Publish'}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Role details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Job title</label>
                <input
                  className={`field ${invalid('title')}`}
                  placeholder="e.g. Senior Data Engineer"
                  value={job.title}
                  onChange={(e) => set('title', e.target.value)}
                />
                <FieldError field="title" />
              </div>

              <div>
                <label className="label">Department</label>
                <select className="field" value={job.department} onChange={(e) => set('department', e.target.value)}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Employment type</label>
                <select
                  className="field"
                  value={job.employmentType}
                  onChange={(e) => set('employmentType', e.target.value as JobDraft['employmentType'])}
                >
                  {TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Location</label>
                <input
                  className={`field ${invalid('location')}`}
                  placeholder="Bengaluru, IN"
                  value={job.location}
                  onChange={(e) => set('location', e.target.value)}
                />
                <FieldError field="location" />
              </div>

              <div>
                <label className="label">Work mode</label>
                <select
                  className="field"
                  value={job.workMode}
                  onChange={(e) => set('workMode', e.target.value as JobDraft['workMode'])}
                >
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="label">Experience band</label>
                <select
                  className="field"
                  value={`${job.experienceMin}-${job.experienceMax}`}
                  onChange={(e) => {
                    const [min, max] = e.target.value.split('-').map(Number);
                    setJob((c) => ({ ...c, experienceMin: min, experienceMax: max }));
                  }}
                >
                  {BANDS.map(([min, max, label]) => (
                    <option key={label} value={`${min}-${max}`}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Number of openings</label>
                <input
                  className="field"
                  type="number"
                  min={1}
                  value={job.openings}
                  onChange={(e) => set('openings', Number(e.target.value))}
                />
              </div>
            </div>
          </Card>

          <Card title="Description" description="Responsibilities, requirements and benefits">
            <textarea
              className="field h-64 resize-y"
              placeholder="About the role…"
              value={job.description}
              onChange={(e) => set('description', e.target.value)}
            />
            <p className="mt-1.5 text-[13px] text-ink-400">
              Basic HTML is allowed and sanitised on save. The rich text editor lands in a later phase.
            </p>
            <div className="mt-4">
              <label className="label">Short description (listing card)</label>
              <textarea
                className="field h-20"
                maxLength={300}
                placeholder="Two lines that make a candidate click."
                value={job.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
              />
              <p className="mt-1 text-[13px] text-ink-400">{job.shortDescription.length}/300</p>
            </div>
          </Card>

          <Card
            title="What the role involves"
            description="One point per line — each becomes a bullet on the public job page"
          >
            <div className="grid gap-4">
              <BulletField
                value={job.responsibilities}
                onChange={(points) => set('responsibilities', points)}
                label="Responsibilities"
                hint="Shown as “What you will do”"
                placeholder={'Own the delivery of a client-facing service\nRun weekly reviews with the engineering leads'}
              />
              <BulletField
                value={job.requirements}
                onChange={(points) => set('requirements', points)}
                label="Requirements"
                hint="Shown as “What we are looking for”"
                placeholder={'5+ years building production data pipelines\nStrong SQL and Python'}
              />
              <BulletField
                value={job.benefits}
                onChange={(points) => set('benefits', points)}
                label="Benefits"
                hint="Shown as “What we offer”"
                placeholder={'Health cover for you and your dependants\nAnnual learning budget'}
              />
            </div>
          </Card>

          <Card title="SEO" description="Overrides the site defaults for this job page">
            <div className="grid gap-4">
              <div>
                <label className="label">Meta title</label>
                <input
                  className="field"
                  placeholder="Senior Data Engineer — Careers at CapabilIQ"
                  value={job.seo?.metaTitle ?? ''}
                  onChange={(e) => set('seo', { ...job.seo, metaTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Meta description</label>
                <textarea
                  className="field h-20"
                  maxLength={160}
                  value={job.seo?.metaDescription ?? ''}
                  onChange={(e) => set('seo', { ...job.seo, metaDescription: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Publishing">
            <div className="space-y-4">
              <div>
                <label className="label">Application deadline</label>
                <input
                  className="field"
                  type="date"
                  value={job.deadline?.slice(0, 10) ?? ''}
                  onChange={(e) => set('deadline', e.target.value)}
                />
                <p className="mt-1.5 text-[13px] text-ink-400">
                  The role closes automatically once this date passes.
                </p>
              </div>
              {job.status && (
                <div>
                  <label className="label">Current status</label>
                  <p className="text-[15px] font-medium text-ink-800">{job.status}</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Compensation">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Minimum</label>
                <input
                  className="field"
                  type="number"
                  placeholder="1800000"
                  value={job.salary?.min ?? ''}
                  onChange={(e) => set('salary', { ...job.salary, min: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Maximum</label>
                <input
                  className="field"
                  type="number"
                  placeholder="2600000"
                  value={job.salary?.max ?? ''}
                  onChange={(e) => set('salary', { ...job.salary, max: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Currency</label>
                <select
                  className="field"
                  value={job.salary?.currency ?? 'INR'}
                  onChange={(e) => set('salary', { ...job.salary, currency: e.target.value })}
                >
                  <option>INR</option>
                  <option>USD</option>
                  <option>AED</option>
                </select>
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-[15px] text-ink-600">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(job.salary?.isPublic)}
                onChange={(e) => set('salary', { ...job.salary, isPublic: e.target.checked })}
              />
              Show salary range publicly
            </label>
          </Card>

          <Card title="Skills" description="Enter or comma to add, backspace to remove the last">
            <input
              className="field"
              placeholder="Type a skill and press Enter"
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={onSkillKeyDown}
              onBlur={() => addSkill(skillDraft)}
            />
            {job.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 text-[13px] font-medium text-brand-700"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => set('skills', job.skills.filter((s) => s !== skill))}
                      className="text-brand-400 hover:text-brand-700"
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
