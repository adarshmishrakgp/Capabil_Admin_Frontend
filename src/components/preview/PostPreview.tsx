'use client';

import type { PostDraft, Taxonomy } from '../PostForm';
import { mediaUrl } from '@/lib/config';

/**
 * How an article will read on capabiliq.com/insights/blog.
 *
 * Mirrors the public component at components/blog/BlogArticle — dark header
 * over a dimmed cover, then the body on the warm stone ground — so an editor
 * can judge length, headings and imagery in the shape a reader will meet them.
 *
 * It is a representation, not the real page: it renders inside the panel and
 * cannot import the public site's components. When the two layouts diverge,
 * the public page is the authority and this should be brought back in line.
 */
const readingMinutes = (html: string) => {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const Empty = ({ children }: { children: string }) => (
  <span className="italic text-white/30">{children}</span>
);

export default function PostPreview({
  post,
  categories,
  authorName,
}: {
  post: PostDraft;
  categories: Taxonomy[];
  authorName: string;
}) {
  const cover = mediaUrl(post.coverImage?.url, post.coverImage?.key);
  const categoryName = categories.find((item) => item._id === post.category)?.name;
  const body = post.contentHtml ?? '';
  const hasBody = Boolean(body.replace(/<[^>]+>/g, '').trim());

  const publishedLabel = new Date(post.publishedAt ?? Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-[#f6f3ef] text-[#171019]">
      {/* ------------------------------ header ------------------------------ */}
      <header className="relative isolate overflow-hidden bg-[#0b0710] p-10 text-white">
        {cover && (
          // A plain <img> rather than next/image: the source is the API's media
          // host and this never ships to a reader, so optimisation is noise.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0b0710] via-[#0b0710]/85 to-[#0b0710]/55"
        />

        <div className="relative mx-auto max-w-2xl">
          <p className="text-[13px] font-medium text-white/60">← Back to the blog</p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 text-[12px] text-white/55">
            {categoryName ? (
              <span className="rounded-full bg-gradient-to-r from-[#9154bb] to-[#c54d92] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                {categoryName}
              </span>
            ) : (
              <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Uncategorised
              </span>
            )}
            <span>{publishedLabel}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/25" />
            <span>{readingMinutes(body)} min read</span>
          </div>

          <h1 className="mt-5 text-[38px] font-semibold leading-[1.04] tracking-[-0.035em]">
            {post.title.trim() || <Empty>Untitled article</Empty>}
          </h1>

          <p className="mt-5 text-[15px] leading-7 text-white/62">
            {post.excerpt?.trim() || <Empty>The excerpt appears here — it is also the card text on the blog index.</Empty>}
          </p>

          <div className="mt-8 flex items-center gap-3 border-t border-white/12 pt-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#9154bb] to-[#c54d92] text-[13px] font-semibold">
              {authorName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-[13px]">
              <span className="block font-medium">{authorName}</span>
              <span className="block text-white/45">Capabiliq</span>
            </span>
          </div>
        </div>
      </header>

      {/* ------------------------------- body -------------------------------- */}
      <section className="p-10">
        {hasBody ? (
          <div
            className="preview-body mx-auto max-w-2xl text-[16px] leading-8 text-[#3f3646]"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <p className="mx-auto max-w-2xl text-center text-[15px] italic text-[#3f3646]/45">
            The article body appears here.
          </p>
        )}
      </section>

      <section className="border-t border-black/10 bg-[#efe9f5] p-10 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9154bb]">Stay in the loop</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
          Perspectives on people, technology and the way we work.
        </h2>
      </section>
    </div>
  );
}
