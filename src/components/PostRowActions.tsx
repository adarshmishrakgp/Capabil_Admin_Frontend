'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SITE_URL } from '@/lib/config';

type Action = { label: string; status: string };

/**
 * Where a post can go from where it is. Editorial workflow rather than a free
 * status dropdown: an archived post is restored as a draft so it gets a second
 * read before it is public again.
 */
const NEXT_ACTIONS: Record<string, Action[]> = {
  draft: [
    { label: 'Publish', status: 'published' },
    { label: 'Send for review', status: 'in_review' },
  ],
  in_review: [
    { label: 'Publish', status: 'published' },
    { label: 'Back to draft', status: 'draft' },
  ],
  scheduled: [
    { label: 'Publish now', status: 'published' },
    { label: 'Back to draft', status: 'draft' },
  ],
  published: [
    { label: 'Unpublish', status: 'draft' },
    { label: 'Archive', status: 'archived' },
  ],
  archived: [{ label: 'Restore as draft', status: 'draft' }],
};

export default function PostRowActions({
  postId,
  status,
  title,
  slug,
}: {
  postId: string;
  status: string;
  title: string;
  slug: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // A menu that only closes on its own trigger stays open behind the next row's.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function run(label: string, request: () => Promise<Response>) {
    setBusy(label);
    setOpen(false);
    const res = await request();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? `Could not ${label.toLowerCase()} this post`);
    }
    setBusy(null);
    router.refresh();
  }

  const changeStatus = (label: string, next: string) =>
    run(label, () =>
      fetch(`/api/proxy/admin/posts/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      }),
    );

  const duplicate = () => run('Duplicate', () => fetch(`/api/proxy/admin/posts/${postId}/duplicate`, { method: 'POST' }));

  const remove = () => {
    if (!confirm(`Delete “${title}”? This also removes its comments and cannot be undone.`)) return;
    return run('Delete', () => fetch(`/api/proxy/admin/posts/${postId}`, { method: 'DELETE' }));
  };

  return (
    <div ref={menuRef} className="relative flex justify-end gap-1.5">
      <a href={`/blog/${postId}/edit`} className="btn-subtle px-2 py-1 text-[13px]">
        Edit
      </a>
      {status === 'published' && (
        <a
          href={`${SITE_URL}/insights/blog/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn-subtle px-2 py-1 text-[13px]"
          title="Open the live article"
        >
          View ↗
        </a>
      )}
      <button
        className="btn-subtle px-2 py-1 text-[13px]"
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${title}`}
      >
        {busy ? '…' : '⋯'}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-9 z-10 w-48 rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop">
          {(NEXT_ACTIONS[status] ?? []).map((action) => (
            <button
              key={action.label}
              role="menuitem"
              onClick={() => changeStatus(action.label, action.status)}
              className="w-full rounded-lg px-3 py-2 text-left text-[14px] text-ink-700 hover:bg-ink-50"
            >
              {action.label}
            </button>
          ))}
          <button
            role="menuitem"
            onClick={duplicate}
            className="w-full rounded-lg px-3 py-2 text-left text-[14px] text-ink-700 hover:bg-ink-50"
          >
            Duplicate
          </button>
          <button
            role="menuitem"
            onClick={remove}
            className="w-full rounded-lg px-3 py-2 text-left text-[14px] text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
