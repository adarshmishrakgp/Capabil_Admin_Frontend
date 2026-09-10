'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import CoverImageUpload, { type CoverImage, pickAndUploadImage } from './CoverImageUpload';
import PostPreview from './preview/PostPreview';
import PreviewShell from './preview/PreviewShell';
import RichTextEditor from './RichTextEditor';
import { Card, StatusBadge, cn } from './ui';
import { SITE_URL } from '@/lib/config';

export type Taxonomy = { _id: string; name: string; slug: string };
export type Author = { _id: string; name: string; designation?: string };

export type PostDraft = {
  _id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  coverImage?: CoverImage | null;
  contentHtml?: string;
  category?: string | { _id: string } | null;
  tags?: (string | { _id: string })[];
  author?: string | { _id: string } | null;
  status?: string;
  isFeatured?: boolean;
  scheduledFor?: string;
  publishedAt?: string;
  readingTimeMinutes?: number;
  viewCount?: number;
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string; canonicalUrl?: string; noindex?: boolean };
};

/** The API populates these on read and expects a bare id on write. */
const idOf = (value: unknown): string =>
  typeof value === 'string' ? value : ((value as { _id?: string } | null)?._id ?? '');

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);

/** Mirrors the API's own estimate so the sidebar number matches what is saved. */
const readingMinutes = (html: string) => {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

/** A local datetime the <input type="datetime-local"> can round-trip. */
const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function PostForm({
  initial,
  postId,
  categories,
  tags,
  authors,
}: {
  initial?: PostDraft;
  postId?: string;
  categories: Taxonomy[];
  tags: Taxonomy[];
  authors: Author[];
}) {
  const router = useRouter();

  const [post, setPost] = useState<PostDraft>(() => ({
    title: '',
    excerpt: '',
    contentHtml: '',
    isFeatured: false,
    seo: {},
    ...initial,
    category: idOf(initial?.category) || '',
    author: idOf(initial?.author) || '',
    tags: (initial?.tags ?? []).map(idOf).filter(Boolean),
  }));

  // Only a brand-new post follows the title; renaming a published article must
  // not silently move its URL out from under everyone who has linked to it.
  const [slugLocked, setSlugLocked] = useState(Boolean(postId));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<null | 'draft' | 'published' | 'scheduled'>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(toLocalInput(initial?.scheduledFor));
  const [previewOpen, setPreviewOpen] = useState(false);

  const set = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) =>
    setPost((current) => ({ ...current, [key]: value }));

  const selectedTags = (post.tags ?? []) as string[];
  const slug = post.slug || slugify(post.title);
  const minutes = useMemo(() => readingMinutes(post.contentHtml ?? ''), [post.contentHtml]);
  const words = useMemo(
    () => (post.contentHtml ?? '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length,
    [post.contentHtml],
  );

  function toggleTag(tagId: string) {
    setPost((current) => {
      const chosen = (current.tags ?? []) as string[];
      return {
        ...current,
        tags: chosen.includes(tagId) ? chosen.filter((t) => t !== tagId) : [...chosen, tagId],
      };
    });
  }

  /* --------------------------------- save --------------------------------- */

  async function save(intent: 'draft' | 'published' | 'scheduled') {
    if (pending !== null || coverUploading || inlineUploading) return;
    if (intent === 'scheduled' && !scheduleAt) {
      setError('Pick the date and time this post should go live.');
      return;
    }

    setPending(intent);
    setError(null);
    setFieldErrors({});

    const payload = {
      title: post.title.trim(),
      slug: slug || undefined,
      excerpt: post.excerpt?.trim() || undefined,
      // An omitted PATCH field leaves the saved image untouched. Null explicitly
      // clears it, so removing a cover also removes it from the public website.
      coverImage: post.coverImage?.url ? post.coverImage : null,
      contentHtml: post.contentHtml ?? '',
      category: (post.category as string) || undefined,
      tags: selectedTags,
      author: (post.author as string) || undefined,
      isFeatured: Boolean(post.isFeatured),
      seo:
        post.seo && Object.values(post.seo).some((v) => v !== undefined && v !== '' && v !== false)
          ? post.seo
          : undefined,
    };

    try {
      const res = await fetch(postId ? `/api/proxy/admin/posts/${postId}` : '/api/proxy/admin/posts', {
        method: postId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (body?.error?.details) {
          setFieldErrors(
            Object.fromEntries(body.error.details.map((d: { field: string; issue: string }) => [d.field, d.issue])),
          );
        }
        setError(body?.error?.message ?? 'Could not save this post');
        setPending(null);
        return;
      }

      // Content and status are separate endpoints: writing a post takes
      // posts:write, putting it in front of the public takes posts:publish.
      const id = postId ?? body.data._id;
      if (intent !== 'draft') {
        const status = await fetch(`/api/proxy/admin/posts/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            intent === 'scheduled'
              ? { status: 'scheduled', scheduledFor: new Date(scheduleAt).toISOString() }
              : { status: 'published' },
          ),
        });
        if (!status.ok) {
          const statusBody = await status.json().catch(() => ({}));
          setError(statusBody?.error?.message ?? 'Saved as a draft, but the status change failed');
          setPending(null);
          return;
        }
      }

      router.push('/blog');
      router.refresh();
    } catch {
      setError('Network error — is the API running?');
      setPending(null);
    }
  }

  const invalid = (field: string) => (fieldErrors[field] ? 'border-rose-400 focus:border-rose-400' : '');
  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="mt-1 text-[13px] text-rose-600">{fieldErrors[field]}</p> : null;

  const busy = pending !== null || coverUploading || inlineUploading;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {postId ? 'Edit article' : 'Write an article'}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-ink-500">
            {postId && post.status ? (
              <>
                <StatusBadge status={post.status} />
                <span>
                  {words.toLocaleString('en-GB')} words · {minutes} min read
                </span>
              </>
            ) : (
              <span>Nothing is public until you publish it.</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost" onClick={() => setPreviewOpen(true)}>
            Preview
          </button>
          <Link href="/blog" className="btn-ghost">
            Cancel
          </Link>
          <button className="btn-ghost" onClick={() => save('draft')} disabled={busy}>
            {pending === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
          <button className="btn-primary" onClick={() => save('published')} disabled={busy}>
            {pending === 'published' ? 'Publishing…' : post.status === 'published' ? 'Update live post' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          {error}
        </p>
      )}

      {postId && post.status && post.status !== 'published' && (
        <p className="mb-4 rounded-xl bg-ink-50 px-4 py-3 text-[15px] text-ink-600 ring-1 ring-inset ring-ink-200">
          This article is <strong className="text-ink-900">{post.status.replace(/_/g, ' ')}</strong>, so it is not on
          capabiliq.com yet. Use <strong className="text-ink-900">Preview</strong> to see how it will look, then publish
          when you are happy with it.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="grid gap-4">
              <div>
                <label className="label" htmlFor="post-title">
                  Title
                </label>
                <input
                  id="post-title"
                  className={cn('field text-[17px] font-medium', invalid('title'))}
                  placeholder="e.g. The operating model behind a resilient GCC"
                  value={post.title}
                  onChange={(event) => set('title', event.target.value)}
                />
                <FieldError field="title" />
              </div>

              <div>
                <label className="label" htmlFor="post-slug">
                  URL
                </label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[13px] text-ink-400">/insights/blog/</span>
                  <input
                    id="post-slug"
                    className={cn('field font-mono text-[13px]', invalid('slug'))}
                    placeholder="auto-generated-from-the-title"
                    value={slugLocked ? (post.slug ?? slug) : slug}
                    readOnly={!slugLocked}
                    onChange={(event) => set('slug', slugify(event.target.value))}
                  />
                  {!slugLocked && (
                    <button type="button" className="btn-subtle shrink-0 px-2 py-1 text-[13px]" onClick={() => setSlugLocked(true)}>
                      Edit
                    </button>
                  )}
                </div>
                <FieldError field="slug" />
                {postId && (
                  <p className="mt-1 text-[13px] text-amber-700">
                    Changing this breaks every existing link to the article. Only do it before it has been shared.
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="post-excerpt">
                  Excerpt
                </label>
                <textarea
                  id="post-excerpt"
                  className={cn('field h-20 resize-y', invalid('excerpt'))}
                  maxLength={320}
                  placeholder="The two lines that appear on the blog card and in search results."
                  value={post.excerpt ?? ''}
                  onChange={(event) => set('excerpt', event.target.value)}
                />
                <p className="mt-1 text-[13px] text-ink-400">{(post.excerpt ?? '').length}/320</p>
                <FieldError field="excerpt" />
              </div>
            </div>
          </Card>

          <Card title="Article body" description="Headings, lists and quotes are kept; everything is sanitised on save">
            <RichTextEditor
              value={post.contentHtml ?? ''}
              onChange={(html) => set('contentHtml', html)}
              onInsertImage={async () => (await pickAndUploadImage())?.url ?? null}
              onUploadingChange={setInlineUploading}
              disabled={pending !== null}
            />
            <p className="mt-2 text-[13px] text-ink-400">
              {words.toLocaleString('en-GB')} words · roughly a {minutes} minute read
            </p>
          </Card>

          <Card title="Search appearance" description="Overrides the site defaults for this article">
            <div className="grid gap-4">
              <div>
                <label className="label" htmlFor="seo-title">
                  Meta title
                </label>
                <input
                  id="seo-title"
                  className="field"
                  placeholder={post.title ? `${post.title} | Capabiliq` : 'Article title | Capabiliq'}
                  value={post.seo?.metaTitle ?? ''}
                  onChange={(event) => set('seo', { ...post.seo, metaTitle: event.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="seo-description">
                  Meta description
                </label>
                <textarea
                  id="seo-description"
                  className="field h-20"
                  maxLength={160}
                  placeholder={post.excerpt || 'A one-sentence summary for search results.'}
                  value={post.seo?.metaDescription ?? ''}
                  onChange={(event) => set('seo', { ...post.seo, metaDescription: event.target.value })}
                />
                <p className="mt-1 text-[13px] text-ink-400">{(post.seo?.metaDescription ?? '').length}/160</p>
              </div>
              <div>
                <label className="label" htmlFor="seo-canonical">
                  Canonical URL
                </label>
                <input
                  id="seo-canonical"
                  className="field"
                  placeholder="Only needed if this article was first published elsewhere"
                  value={post.seo?.canonicalUrl ?? ''}
                  onChange={(event) => set('seo', { ...post.seo, canonicalUrl: event.target.value })}
                />
              </div>
              <label className="flex items-start gap-2.5 text-[15px] text-ink-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={Boolean(post.seo?.noindex)}
                  onChange={(event) => set('seo', { ...post.seo, noindex: event.target.checked })}
                />
                <span>
                  Hide from search engines
                  <span className="block text-[13px] text-ink-400">
                    The article stays reachable by anyone with the link.
                  </span>
                </span>
              </label>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Publishing">
            <div className="space-y-4">
              {postId && post.status && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
                  <span className="text-[13px] text-ink-500">Current status</span>
                  <StatusBadge status={post.status} />
                </div>
              )}

              <div>
                <label className="label" htmlFor="schedule-at">
                  Schedule for later
                </label>
                <input
                  id="schedule-at"
                  type="datetime-local"
                  className="field"
                  value={scheduleAt}
                  onChange={(event) => setScheduleAt(event.target.value)}
                />
                <button
                  type="button"
                  className="btn-ghost mt-2 w-full"
                  onClick={() => save('scheduled')}
                  disabled={busy || !scheduleAt}
                >
                  {pending === 'scheduled' ? 'Scheduling…' : 'Save & schedule'}
                </button>
                <p className="mt-1.5 text-[13px] text-ink-400">
                  Checked every five minutes — it goes live on its own, no one has to be at a desk.
                </p>
              </div>

              <label className="flex items-start gap-2.5 border-t border-ink-200 pt-4 text-[15px] text-ink-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={Boolean(post.isFeatured)}
                  onChange={(event) => set('isFeatured', event.target.checked)}
                />
                <span>
                  Feature this article
                  <span className="block text-[13px] text-ink-400">
                    Runs as the cover story at the top of the blog. The newest featured article wins.
                  </span>
                </span>
              </label>

              {post.status === 'published' && (
                <a
                  href={`${SITE_URL}/insights/blog/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost w-full"
                >
                  View live article ↗
                </a>
              )}
            </div>
          </Card>

          <Card title="Cover image" description="Shown on the blog card, the article header and social shares">
            <CoverImageUpload
              value={post.coverImage}
              onChange={(cover) => set('coverImage', cover)}
              onUploadingChange={setCoverUploading}
              disabled={pending !== null}
            />
          </Card>

          <Card title="Organisation">
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="post-category">
                  Category
                </label>
                <select
                  id="post-category"
                  className="field"
                  value={(post.category as string) ?? ''}
                  onChange={(event) => set('category', event.target.value)}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[13px] text-ink-400">
                  Drives the filter chips on the blog.{' '}
                  <Link href="/blog/taxonomy" className="text-brand-600 hover:underline">
                    Manage categories
                  </Link>
                </p>
              </div>

              <div>
                <label className="label" htmlFor="post-author">
                  Author
                </label>
                <select
                  id="post-author"
                  className="field"
                  value={(post.author as string) ?? ''}
                  onChange={(event) => set('author', event.target.value)}
                >
                  <option value="">You</option>
                  {authors.map((author) => (
                    <option key={author._id} value={author._id}>
                      {author.name}
                      {author.designation ? ` — ${author.designation}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="label">Tags</span>
                {tags.length === 0 ? (
                  <p className="text-[13px] text-ink-400">
                    No tags yet.{' '}
                    <Link href="/blog/taxonomy" className="text-brand-600 hover:underline">
                      Create some
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const chosen = selectedTags.includes(tag._id);
                      return (
                        <button
                          key={tag._id}
                          type="button"
                          aria-pressed={chosen}
                          onClick={() => toggleTag(tag._id)}
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-[13px] font-medium ring-1 ring-inset transition-colors',
                            chosen
                              ? 'bg-brand-600 text-white ring-brand-600'
                              : 'bg-white text-ink-600 ring-ink-200 hover:border-brand-300 hover:text-brand-700',
                          )}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {postId && (
            <Card title="Performance">
              <dl className="grid grid-cols-2 gap-3 text-[15px]">
                <div>
                  <dt className="text-[13px] text-ink-500">Reads</dt>
                  <dd className="text-xl font-semibold text-ink-900">{(post.viewCount ?? 0).toLocaleString('en-GB')}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-ink-500">Published</dt>
                  <dd className="font-medium text-ink-800">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not yet'}
                  </dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
      </div>

      <PreviewShell
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={post.title.trim() || 'Untitled article'}
        subtitle={`capabiliq.com/insights/blog/${slug || '…'}`}
      >
        <PostPreview
          post={post}
          categories={categories}
          authorName={authors.find((a) => a._id === post.author)?.name ?? 'Capabiliq'}
        />
      </PreviewShell>
    </>
  );
}
