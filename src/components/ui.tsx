import Link from 'next/link';
import type { ReactNode } from 'react';

export function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ');
}

/* ---------------------------------- shell ---------------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn('card', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-ink-200 px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-ink-800">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

/* ---------------------------------- badges --------------------------------- */

const TONES: Record<string, string> = {
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  pink: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
};

export type Tone = keyof typeof TONES;

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        TONES[tone] ?? TONES.neutral,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  published: 'green',
  active: 'green',
  confirmed: 'green',
  hired: 'green',
  selected: 'green',
  won: 'green',
  approved: 'green',
  draft: 'neutral',
  archived: 'neutral',
  closed: 'neutral',
  unsubscribed: 'neutral',
  lost: 'red',
  rejected: 'red',
  bounced: 'red',
  spam: 'red',
  paused: 'amber',
  pending: 'amber',
  scheduled: 'amber',
  in_review: 'amber',
  under_review: 'amber',
  on_hold: 'amber',
  new: 'brand',
  shortlisted: 'blue',
  interview: 'blue',
  contacted: 'blue',
  qualified: 'pink',
  proposal: 'pink',
  sending: 'blue',
  sent: 'green',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{humanize(status)}</Badge>;
}

export function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ----------------------------------- stats --------------------------------- */

export function StatCard({
  label,
  value,
  delta,
  hint,
  href,
  icon,
}: {
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
  href?: string;
  icon?: ReactNode;
}) {
  const body = (
    <div className="card h-full p-5 transition-all hover:border-brand-300 hover:shadow-pop">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {icon && (
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-[13px]">
        {typeof delta === 'number' && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium',
              delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
            )}
          >
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-ink-400">{hint}</span>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/* ----------------------------------- table --------------------------------- */

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b border-ink-200 bg-ink-50/70">
          <tr>
            {head.map((h) => (
              <th key={h} className="th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Toolbar({
  placeholder,
  filters = [],
  children,
}: {
  placeholder: string;
  filters?: { label: string; options: string[] }[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 px-5 py-3.5">
      <div className="relative min-w-[220px] flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <input className="field pl-8" placeholder={placeholder} />
      </div>
      {filters.map((f) => (
        <select key={f.label} className="field w-auto" defaultValue="">
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o}>{humanize(o)}</option>
          ))}
        </select>
      ))}
      {children}
    </div>
  );
}

export function Pagination({ total, page = 1, limit = 10 }: { total: number; page?: number; limit?: number }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between border-t border-ink-200 px-5 py-3.5 text-[15px] text-ink-500">
      <span>
        Showing <span className="font-medium text-ink-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-ink-700">{total}</span>
      </span>
      <div className="flex gap-1.5">
        <button className="btn-ghost px-3 py-1.5" disabled={page === 1}>
          Previous
        </button>
        <button className="btn-ghost px-3 py-1.5">Next</button>
      </div>
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
          <path d="M3 7h18v13H3zM3 7l2-3h14l2 3M9 12h6" />
        </svg>
      </div>
      <p className="text-[15px] font-medium text-ink-700">{title}</p>
      {hint && <p className="max-w-sm text-[15px] text-ink-500">{hint}</p>}
      {action}
    </div>
  );
}
