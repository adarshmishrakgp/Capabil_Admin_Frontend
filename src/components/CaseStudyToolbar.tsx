import Link from 'next/link';
import { humanize } from './ui';

/**
 * Filters for the case study list.
 *
 * A plain GET form rather than a client component: the state ends up in the URL,
 * so a filtered view can be bookmarked and shared, the back button behaves, and
 * the results stay server-rendered. Submitting works without JavaScript.
 */
export default function CaseStudyToolbar({
  search,
  sector,
  status,
  sectors,
  statuses,
}: {
  search?: string;
  sector?: string;
  status?: string;
  sectors: string[];
  statuses: string[];
}) {
  const hasFilters = Boolean(search || sector || status);

  return (
    <form method="get" className="flex flex-wrap items-center gap-2 border-b border-ink-200 px-5 py-3.5">
      <div className="relative min-w-[220px] flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <input
          name="search"
          type="search"
          className="field pl-8"
          placeholder="Search by title, client or summary…"
          defaultValue={search ?? ''}
          aria-label="Search case studies"
        />
      </div>

      <select name="sector" className="field w-auto" defaultValue={sector ?? ''} aria-label="Filter by sector">
        <option value="">All sectors</option>
        {sectors.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <select name="status" className="field w-auto" defaultValue={status ?? ''} aria-label="Filter by status">
        <option value="">All statuses</option>
        {statuses.map((value) => (
          <option key={value} value={value}>
            {humanize(value)}
          </option>
        ))}
      </select>

      <button type="submit" className="btn-ghost">
        Apply
      </button>

      {hasFilters && (
        <Link href="/case-studies" className="btn-subtle px-2.5 py-1.5 text-[13px]">
          Clear
        </Link>
      )}
    </form>
  );
}
