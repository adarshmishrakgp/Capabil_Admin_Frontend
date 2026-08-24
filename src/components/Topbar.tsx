'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar } from './ui';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export default function Topbar({ roleLabel = 'Signed in' }: { roleLabel?: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/session', { method: 'DELETE' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/85 px-5 backdrop-blur lg:px-8">
      <div className="relative hidden max-w-md flex-1 md:block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          <SearchIcon />
        </span>
        <input
          className="field pl-8"
          placeholder="Search jobs, candidates, subscribers…"
          aria-label="Global search"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-ink-200 px-1.5 py-0.5 text-[11px] text-ink-400 lg:block">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <a href="https://capabiliq.com" target="_blank" rel="noreferrer" className="btn-ghost hidden sm:inline-flex">
          Visit site ↗
        </a>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
            }}
            className="btn-subtle relative h-9 w-9 p-0"
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-600 ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-ink-200 bg-white p-2 shadow-pop">
              <p className="px-2.5 py-2 text-[13px] font-semibold uppercase tracking-wider text-ink-400">
                Notifications
              </p>
              {[
                ['New application', 'Rohit Menon applied for Product Designer'],
                ['New lead', 'Zenith Bank requested a demo'],
                ['Comment awaiting moderation', 'On “The capability gap nobody measures”'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl px-2.5 py-2 hover:bg-ink-100">
                  <p className="text-sm font-medium text-ink-800">{title}</p>
                  <p className="text-[13px] text-ink-500">{body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-ink-100"
            aria-label="Account menu"
          >
            <Avatar name="Admin" />
            <span className="hidden text-xs text-ink-400 sm:block">{roleLabel}</span>
            <span className="text-ink-400">▾</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-ink-200 bg-white p-1.5 shadow-pop">
              {['My profile', 'Account settings', 'Keyboard shortcuts'].map((i) => (
                <button key={i} className="w-full rounded-xl px-3 py-2 text-left text-[15px] text-ink-700 hover:bg-ink-100">
                  {i}
                </button>
              ))}
              <div className="my-1 border-t border-ink-200" />
              <button
                onClick={signOut}
                disabled={signingOut}
                className="w-full rounded-xl px-3 py-2 text-left text-[15px] text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
