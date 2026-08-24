'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Action = { label: string; status?: string; danger?: boolean };

const NEXT_ACTIONS: Record<string, Action[]> = {
  draft: [{ label: 'Publish', status: 'published' }],
  published: [
    { label: 'Pause', status: 'paused' },
    { label: 'Close', status: 'closed' },
  ],
  paused: [
    { label: 'Publish', status: 'published' },
    { label: 'Close', status: 'closed' },
  ],
  closed: [{ label: 'Reopen', status: 'published' }],
};

export default function JobRowActions({ jobId, status, title }: { jobId: string; status: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function run(label: string, request: () => Promise<Response>) {
    setBusy(label);
    setOpen(false);
    const res = await request();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? `Could not ${label.toLowerCase()} this job`);
    }
    setBusy(null);
    router.refresh();
  }

  const changeStatus = (label: string, next: string) =>
    run(label, () =>
      fetch(`/api/proxy/admin/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      }),
    );

  const duplicate = () => run('Duplicate', () => fetch(`/api/proxy/admin/jobs/${jobId}/duplicate`, { method: 'POST' }));

  const archive = () => {
    if (!confirm(`Archive “${title}”? Applications already received are kept.`)) return;
    return run('Archive', () => fetch(`/api/proxy/admin/jobs/${jobId}`, { method: 'DELETE' }));
  };

  return (
    <div className="relative flex justify-end gap-1.5">
      <a href={`/jobs/${jobId}/edit`} className="btn-subtle px-2 py-1 text-[13px]">
        Edit
      </a>
      <button className="btn-subtle px-2 py-1 text-[13px]" onClick={duplicate} disabled={busy !== null}>
        {busy === 'Duplicate' ? '…' : 'Duplicate'}
      </button>
      <button
        className="btn-subtle px-2 py-1 text-[13px]"
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        aria-label="More actions"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-10 w-40 rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop">
          {(NEXT_ACTIONS[status] ?? []).map((action) => (
            <button
              key={action.label}
              onClick={() => changeStatus(action.label, action.status!)}
              className="w-full rounded-lg px-3 py-2 text-left text-[14px] text-ink-700 hover:bg-ink-50"
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={archive}
            className="w-full rounded-lg px-3 py-2 text-left text-[14px] text-rose-600 hover:bg-rose-50"
          >
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
