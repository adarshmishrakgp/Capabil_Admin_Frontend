import Link from 'next/link';
import TaxonomyManager, { type TaxonomyItem } from '@/components/TaxonomyManager';
import { Badge, PageHeader } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Categories & tags' };
export const dynamic = 'force-dynamic';

export default async function TaxonomyPage() {
  const [categories, tags] = await Promise.all([
    apiFetch<TaxonomyItem[]>('/admin/categories'),
    apiFetch<TaxonomyItem[]>('/admin/tags'),
  ]);

  const failure = !categories.ok ? categories.error : !tags.ok ? tags.error : null;

  return (
    <>
      <PageHeader
        title="Categories & tags"
        subtitle="Categories become the filter chips on the blog. Tags group articles across categories."
        actions={
          <Link href="/blog" className="btn-ghost">
            Back to posts
          </Link>
        }
      />

      {failure && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-[15px] text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          {failure}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <TaxonomyManager
          kind="categories"
          title="Categories"
          description="One per article — it decides which filter the post appears under"
          items={categories.ok ? categories.data : []}
          withDescription
        />
        <TaxonomyManager
          kind="tags"
          title="Tags"
          description="As many as fit — a post can carry several"
          items={tags.ok ? tags.data : []}
        />
      </div>

      <p className="mt-4 text-[13px] text-ink-400">
        <Badge tone="brand">Safeguard</Badge>{' '}
        <span className="ml-2">
          A category or tag still attached to a post cannot be deleted — move those posts first, so nothing on the
          public site is left pointing at a filter that no longer exists.
        </span>
      </p>
    </>
  );
}
