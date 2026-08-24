'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from './ui';

/** Extending a deadline is the most common edit on a live role, so it gets its
 *  own control instead of a trip through the full edit form. */
export default function JobDeadlineControl({
  jobId,
  deadline,
  daysLeft,
  status,
}: {
  jobId: string;
  deadline?: string;
  daysLeft: number | null;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(deadline?.slice(0, 10) ?? '');
  const [busy, setBusy] = useState(false);

  async function save(nextDate: string, alsoReopen: boolean) {
    setBusy(true);
    const res = await fetch(`/api/proxy/admin/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deadline: nextDate }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? 'Could not update the deadline');
      setBusy(false);
      return;
    }

    // a closed role with a fresh deadline should go back on the careers page
    if (alsoReopen && status === 'closed') {
      await fetch(`/api/proxy/admin/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
    }

    setBusy(false);
    router.refresh();
  }

  function extendBy(days: number) {
    // extend from today when it has already lapsed, otherwise from the deadline
    const base = deadline && new Date(deadline) > new Date() ? new Date(deadline) : new Date();
    base.setDate(base.getDate() + days);
    const next = base.toISOString().slice(0, 10);
    setValue(next);
    save(next, true);
  }

  const tone = daysLeft === null ? 'neutral' : daysLeft < 0 ? 'red' : daysLeft <= 7 ? 'amber' : 'green';
  const label =
    daysLeft === null
      ? 'No deadline set'
      : daysLeft < 0
        ? `Closed ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago`
        : daysLeft === 0
          ? 'Last day to apply'
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to apply`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-ink-900">
          {deadline ? new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </p>
        <Badge tone={tone as never}>{label}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[7, 15, 30].map((days) => (
          <button key={days} className="btn-ghost px-3 py-1.5 text-[13px]" onClick={() => extendBy(days)} disabled={busy}>
            + {days} days
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="date"
          className="field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Application deadline"
        />
        <button className="btn-primary" onClick={() => save(value, true)} disabled={busy || !value || value === deadline?.slice(0, 10)}>
          {busy ? 'Saving…' : 'Set'}
        </button>
      </div>

      <p className="mt-2 text-[13px] text-ink-400">
        Roles close automatically the night after their deadline. Extending a closed role republishes it.
      </p>
    </div>
  );
}
