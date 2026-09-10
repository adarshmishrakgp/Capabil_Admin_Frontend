'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { label: string; href: string; badge?: string };
type Group = { heading: string; items: Item[] };

const NAV: Group[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', href: '/' }],
  },
  {
    heading: 'Recruitment',
    items: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Applications', href: '/applications' },
      { label: 'Candidates', href: '/candidates' },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Blog posts', href: '/blog' },
      { label: 'Case studies', href: '/case-studies' },
      { label: 'Categories & tags', href: '/blog/taxonomy' },
      { label: 'Comments', href: '/blog/comments' },
    ],
  },
  {
    heading: 'Audience',
    items: [
      { label: 'Leads', href: '/leads' },
      { label: 'Subscribers', href: '/newsletter' },
    ],
  },
  {
    heading: 'System',
    items: [{ label: 'Audit log', href: '/audit' }],
  },
];

/** 24×24 stroke paths, drawn in currentColor so they inherit the link state. */
const ICON_PATHS: Record<string, string> = {
  Dashboard: 'M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z',
  Jobs: 'M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18',
  Applications: 'M3 7l9 6 9-6M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z',
  Candidates: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87',
  'Blog posts': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2zM9 7h7M9 11h7',
  'Categories & tags': 'M20.6 13.4 12 4.8V2H4v8h2.8l8.6 8.6a2 2 0 0 0 2.8 0l2.4-2.4a2 2 0 0 0 0-2.8zM7.5 6.5h.01',
  Comments: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l2-4.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z',
  'Case studies': 'M12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
  Subscribers: 'M4 4h16v16H4zM4 8l8 5 8-5',
  Leads: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  'Audit log': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
};

function Icon({ name, className }: { name: string; className?: string }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export default function Sidebar({
  newApplications = 0,
  publishedJobs = 0,
  openApplications = 0,
  pendingComments = 0,
}: {
  newApplications?: number;
  publishedJobs?: number;
  openApplications?: number;
  pendingComments?: number;
}) {
  const pathname = usePathname();

  /**
   * The most specific match wins. A plain prefix test would light up both
   * "Blog posts" (/blog) and "Categories & tags" (/blog/taxonomy) on the
   * taxonomy page, because one href is a prefix of the other.
   */
  const matches = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const bestMatch = NAV.flatMap((group) => group.items)
    .map((item) => item.href)
    .filter(matches)
    .sort((a, b) => b.length - a.length)[0];

  const isActive = (href: string) => href === bestMatch;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-night bg-gradient-to-b from-[#1f1228] to-[#170d1d] lg:flex">
      <Link
        href="/"
        className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5"
        aria-label="CapabilIQ admin home"
      >
        <Image src="/logo.png" alt="CapabilIQ" width={256} height={64} priority className="h-7 w-auto" />
      </Link>

      <nav className="scrollbar-night flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.heading} className="mb-5">
            <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-widest text-white/45">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const count =
                  item.label === 'Applications' ? newApplications : item.label === 'Comments' ? pendingComments : 0;
                const badge = count > 0 ? String(count) : undefined;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={[
                        'group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[15px] transition-colors',
                        active
                          ? 'bg-brand-600 font-medium text-white'
                          : 'text-white/65 hover:bg-white/10 hover:text-white',
                      ].join(' ')}
                    >
                      <Icon
                        name={item.label}
                        className={[
                          'h-[18px] w-[18px] shrink-0',
                          active ? 'text-white' : 'text-white/45 group-hover:text-white/80',
                        ].join(' ')}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge && (
                        <span
                          className="rounded-md bg-accent-600 px-1.5 py-0.5 text-xs font-semibold text-white"
                          title={
                            item.label === 'Comments'
                              ? `${badge} comment(s) waiting for moderation`
                              : `${badge} application(s) in the last 7 days`
                          }
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/[0.07] p-3.5 text-white ring-1 ring-inset ring-white/10">
          <p className="text-sm font-semibold">
            {publishedJobs > 0 ? 'Careers page is live' : 'No roles published yet'}
          </p>
          <p className="mt-0.5 text-xs text-white/55">
            {publishedJobs} published role{publishedJobs === 1 ? '' : 's'} · {openApplications} open application
            {openApplications === 1 ? '' : 's'}
          </p>
          <a
            href="https://capabiliq.com/careers"
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 inline-flex rounded-lg bg-white/12 px-2.5 py-1 text-xs font-medium text-white/90 hover:bg-white/20"
          >
            View public page ↗
          </a>
        </div>
      </div>
    </aside>
  );
}
