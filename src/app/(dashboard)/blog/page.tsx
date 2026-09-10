import Link from 'next/link';
import PostRowActions from '@/components/PostRowActions';
import BlogToolbar from '@/components/BlogToolbar';
import { Badge, Card, EmptyState, PageHeader, StatCard, StatusBadge, Table } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';
import { mediaUrl } from '@/lib/config';

export const metadata = { title: 'Blog posts' };
export const dynamic = 'force-dynamic';

export type PostRow = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: { url?: string; key?: string; alt?: string } | null;
  category?: { _id: string; name: string; slug: string } | null;
  tags?: { _id: string; name: string; slug: string }[];
  author?: { _id: string; name: string } | null;
  status: string;
  isFeatured?: boolean;
  readingTimeMinutes?: number;
  viewCount?: number;
  publishedAt?: string;
  scheduledFor?: string;
  updatedAt?: string;
};

type Category = { _id: string; name: string; slug: string };

const STATUSES = ['published', 'draft', 'in_review', 'scheduled', 'archived'];

const shortDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; status?: string }>;
}) {
  const { search, category, status } = await searchParams;

  const query = new URLSearchParams({ limit: '100', sort: '-updatedAt' });
  if (search) query.set('search', search);
  if (category) query.set('category', category);
  if (status) query.set('status', status);

  const [result, categoryResult, allResult] = await Promise.all([
    apiFetch<PostRow[]>(`/admin/posts?${query}`),
    apiFetch<Category[]>('/admin/categories'),
    // The tiles describe the whole blog, not the current filter — otherwise
    // filtering to "Draft" would report zero published posts.
    apiFetch<PostRow[]>('/admin/posts?limit=200&sort=-updatedAt'),
  ]);

  const posts = result.ok ? result.data : [];
  const categories = categoryResult.ok ? categoryResult.data : [];
  const everything = allResult.ok ? allResult.data : posts;
  const isFiltered = Boolean(search || category || status);

  const count = (value: string) => everything.filter((p) => p.status === value).length;
  const totalViews = everything.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Blog posts"
        subtitle="Write, schedule and publish articles. Published posts appear on capabiliq.com/insights/blog within a minute."
        actions={
          <>
            <Link href="/blog/taxonomy" className="btn-ghost">
              Categories &amp; tags
            </Link>
            <Link href="/blog/new" className="btn-primary">
              + New post
            </Link>
          </>
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

      {/*
        The single most common confusion: work is written, saved, and then not
        on the website — because saving and publishing are separate steps. Say
        so here rather than leaving the status badge to imply it.
      */}
      {result.ok && count('published') === 0 && everything.length > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-[15px] text-amber-800 ring-1 ring-inset ring-amber-200">
          <strong>Nothing is live on the blog yet.</strong> You have{' '}
          {everything.length === 1 ? 'one article' : `${everything.length} articles`} saved, but only <em>published</em>{' '}
          articles appear at /insights/blog. Open one, use <strong>Preview</strong> to check it, then{' '}
          <strong>Publish</strong>.
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published" value={count('published')} hint="live on the blog" />
        <StatCard label="Drafts" value={count('draft') + count('in_review')} hint="not visible publicly" />
        <StatCard label="Scheduled" value={count('scheduled')} hint="publish automatically" />
        <StatCard label="Total reads" value={totalViews.toLocaleString('en-GB')} hint="across all articles" />
      </div>

      <Card padded={false}>
        <BlogToolbar
          search={search}
          category={category}
          status={status}
          categories={categories}
          statuses={STATUSES}
        />

        {posts.length === 0 ? (
          <EmptyState
            title={!result.ok ? 'Could not load posts' : isFiltered ? 'Nothing matched those filters' : 'No posts yet'}
            hint={
              !result.ok
                ? 'Fix the error above and reload this page.'
                : isFiltered
                  ? 'Try a broader search, or clear the filters to see every article.'
                  : 'Write your first article — it stays a draft until you publish it.'
            }
            action={
              !result.ok ? undefined : isFiltered ? (
                <Link href="/blog" className="btn-ghost mt-2">
                  Clear filters
                </Link>
              ) : (
                <Link href="/blog/new" className="btn-primary mt-2">
                  + New post
                </Link>
              )
            }
          />
        ) : (
          <Table head={['Article', 'Category', 'Author', 'Published', 'Reads', 'Status', '']}>
            {posts.map((post) => (
              <tr key={post._id} className="hover:bg-ink-50/60">
                <td className="td max-w-[420px] whitespace-normal">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100 bg-cover bg-center ring-1 ring-inset ring-ink-200"
                      style={post.coverImage?.url ? { backgroundImage: `url(${mediaUrl(post.coverImage.url, post.coverImage.key)})` } : undefined}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <Link
                        href={`/blog/${post._id}/edit`}
                        className="font-medium text-ink-900 hover:text-brand-700 hover:underline"
                      >
                        {post.title}
                      </Link>
                      {post.isFeatured && (
                        <span className="ml-2 align-middle">
                          <Badge tone="pink">Featured</Badge>
                        </span>
                      )}
                      <span className="mt-0.5 block truncate text-[13px] text-ink-400">
                        /insights/blog/{post.slug} · {post.readingTimeMinutes ?? 1} min read
                      </span>
                    </span>
                  </div>
                </td>
                <td className="td">{post.category?.name ?? <span className="text-ink-400">Uncategorised</span>}</td>
                <td className="td">{post.author?.name ?? '—'}</td>
                <td className="td">
                  {post.status === 'scheduled' ? (
                    <span title="Publishes automatically">{shortDate(post.scheduledFor)}</span>
                  ) : (
                    shortDate(post.publishedAt)
                  )}
                </td>
                <td className="td">{(post.viewCount ?? 0).toLocaleString('en-GB')}</td>
                <td className="td">
                  <StatusBadge status={post.status} />
                </td>
                <td className="td text-right">
                  <PostRowActions postId={post._id} status={post.status} title={post.title} slug={post.slug} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <p className="mt-4 text-[13px] text-ink-400">
        <Badge tone="brand">Automation</Badge>{' '}
        <span className="ml-2">
          Scheduled posts go live on their own every five minutes, and publishing re-renders{' '}
          <code className="rounded bg-ink-100 px-1 py-0.5">/insights/blog</code> on the public site straight away.
        </span>
      </p>
    </>
  );
}
