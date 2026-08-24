'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const router = useRouter();
  const nextPath = useSearchParams().get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Could not sign you in');
        setPending(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError('Network error — check that the API is running');
      setPending(false);
    }
  }

  return (
    <form className="mt-7 space-y-4" onSubmit={onSubmit}>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="field"
          placeholder="you@capabiliq.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="password">
            Password
          </label>
          <a href="#" className="mb-1.5 text-sm font-medium text-brand-600 hover:underline">
            Forgot?
          </a>
        </div>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-[15px] text-ink-600">
        <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600" />
        Keep me signed in for 7 days
      </label>

      <button className="btn-primary w-full py-2.5" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
