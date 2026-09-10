import PostForm, { type Author, type Taxonomy } from '@/components/PostForm';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'New post' };
export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  // The pickers degrade to empty lists rather than blocking the page — an
  // article can be written and saved without a category, tag or explicit author.
  const [categories, tags, authors] = await Promise.all([
    apiFetch<Taxonomy[]>('/admin/categories'),
    apiFetch<Taxonomy[]>('/admin/tags'),
    apiFetch<Author[]>('/admin/authors'),
  ]);

  return (
    <PostForm
      categories={categories.ok ? categories.data : []}
      tags={tags.ok ? tags.data : []}
      authors={authors.ok ? authors.data : []}
    />
  );
}
