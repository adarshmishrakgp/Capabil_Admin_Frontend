import Link from 'next/link';
import PostForm, { type Author, type PostDraft, type Taxonomy } from '@/components/PostForm';
import { Card, PageHeader } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Edit post' };
export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [result, categories, tags, authors] = await Promise.all([
    apiFetch<PostDraft>(`/admin/posts/${id}`),
    apiFetch<Taxonomy[]>('/admin/categories'),
    apiFetch<Taxonomy[]>('/admin/tags'),
    apiFetch<Author[]>('/admin/authors'),
  ]);

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Edit post" />
        <Card>
          <p className="text-[15px] text-ink-600">{result.error}</p>
          <Link href="/blog" className="btn-ghost mt-4">
            Back to posts
          </Link>
        </Card>
      </>
    );
  }

  return (
    <PostForm
      postId={id}
      initial={result.data}
      categories={categories.ok ? categories.data : []}
      tags={tags.ok ? tags.data : []}
      authors={authors.ok ? authors.data : []}
    />
  );
}
