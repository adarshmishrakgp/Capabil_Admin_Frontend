import Link from 'next/link';
import CommentModeration, { type CommentRow } from '@/components/CommentModeration';
import { Badge, Card, EmptyState, PageHeader, StatCard, cn } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Comments' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { label: 'Awaiting moderation', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Spam', value: 'spam' },
  { label: 'Everything', value: '' },
] as const;

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  // Moderation is the reason to open this page, so an unfiltered visit lands on
  // the queue rather than on a wall of comments already dealt with.
  const active = status ?? 'pending';

  const [result, all] = await Promise.all([
    apiFetch<CommentRow[]>(`/admin/comments?limit=100&sort=-createdAt${active ? `&status=${active}` : ''}`),
    apiFetch<CommentRow[]>('/admin/comments?limit=200'),
  ]);

  const comments = result.ok ? result.data : [];
  const everything = all.ok ? all.data : [];
  const count = (value: string) => everything.filter((c) => c.status === value).length;

  return (
    <>
      <PageHeader
        title="Comments"
        subtitle="Every comment arrives held for moderation — nothing reaches an article until it is approved here."
        actions={
          <Link href="/blog" className="btn-ghost">
            Back to posts
          </Link>
        }
      />

      {!result.ok && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          {result.error}
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting moderation" value={count('pending')} hint="not visible on the site" />
        <StatCard label="Approved" value={count('approved')} hint="live under their articles" />
        <StatCard label="Marked as spam" value={count('spam')} hint="hidden, kept for reference" />
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-ink-200 px-5 py-3.5">
          {FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value ? `/blog/comments?status=${filter.value}` : '/blog/comments?status='}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors',
                active === filter.value
                  ? 'bg-brand-600 text-white'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
              )}
            >
              {filter.label}
              {filter.value && count(filter.value) > 0 && (
                <span className="ml-1.5 opacity-70">{count(filter.value)}</span>
              )}
            </Link>
          ))}
        </div>

        {comments.length === 0 ? (
          <EmptyState
            title={
              active === 'pending'
                ? 'Nothing waiting'
                : result.ok
                  ? 'No comments here'
                  : 'Could not load comments'
            }
            hint={
              active === 'pending'
                ? 'The moderation queue is clear. New comments will appear here as readers leave them.'
                : undefined
            }
          />
        ) : (
          <CommentModeration comments={comments} />
        )}
      </Card>

      <p className="mt-4 text-[13px] text-ink-400">
        <Badge tone="brand">Spam control</Badge>{' '}
        <span className="ml-2">
          The public form carries a honeypot field and a rate limit of ten submissions an hour per address, so most
          automated spam never reaches this queue.
        </span>
      </p>
    </>
  );
}
