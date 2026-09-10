'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, StatusBadge } from './ui';
import { SITE_URL } from '@/lib/config';

export type CommentRow = {
  _id: string;
  name: string;
  email: string;
  body: string;
  status: 'pending' | 'approved' | 'spam';
  createdAt: string;
  post?: { _id: string; title: string; slug: string } | null;
};

/** What a comment in each state can usefully become next. */
const MOVES: Record<CommentRow['status'], { label: string; status: CommentRow['status']; primary?: boolean }[]> = {
  pending: [
    { label: 'Approve', status: 'approved', primary: true },
    { label: 'Mark as spam', status: 'spam' },
  ],
  approved: [{ label: 'Unpublish', status: 'pending' }],
  spam: [{ label: 'Not spam', status: 'pending' }],
};

export default function CommentModeration({ comments }: { comments: CommentRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, label: string, request: () => Promise<Response>) {
    setBusy(id);
    const res = await request();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message ?? `Could not ${label.toLowerCase()} this comment`);
    }
    setBusy(null);
    router.refresh();
  }

  const moderate = (comment: CommentRow, label: string, status: CommentRow['status']) =>
    act(comment._id, label, () =>
      fetch(`/api/proxy/admin/comments/${comment._id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    );

  const remove = (comment: CommentRow) => {
    if (!confirm(`Delete the comment by ${comment.name}? Replies to it are removed too.`)) return;
    return act(comment._id, 'Delete', () => fetch(`/api/proxy/admin/comments/${comment._id}`, { method: 'DELETE' }));
  };

  return (
    <ul className="divide-y divide-ink-100">
      {comments.map((comment) => (
        <li key={comment._id} className="flex flex-wrap items-start gap-4 px-5 py-4">
          <Avatar name={comment.name} size={36} />

          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink-900">{comment.name}</span>
              <a href={`mailto:${comment.email}`} className="text-[13px] text-ink-400 hover:text-brand-600">
                {comment.email}
              </a>
              <StatusBadge status={comment.status} />
            </div>

            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-6 text-ink-700">{comment.body}</p>

            <p className="mt-2 text-[13px] text-ink-400">
              {new Date(comment.createdAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {comment.post && (
                <>
                  {' · on '}
                  <a
                    href={`${SITE_URL}/insights/blog/${comment.post.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {comment.post.title}
                  </a>
                </>
              )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {MOVES[comment.status].map((move) => (
              <button
                key={move.label}
                className={move.primary ? 'btn-primary px-2.5 py-1 text-[13px]' : 'btn-ghost px-2.5 py-1 text-[13px]'}
                onClick={() => moderate(comment, move.label, move.status)}
                disabled={busy === comment._id}
              >
                {busy === comment._id ? '…' : move.label}
              </button>
            ))}
            <button
              className="btn-subtle px-2 py-1 text-[13px] text-rose-600 hover:bg-rose-50"
              onClick={() => remove(comment)}
              disabled={busy === comment._id}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
