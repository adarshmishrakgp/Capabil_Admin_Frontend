'use client';

import type { CaseStudyDraft } from '../CaseStudyForm';
import { mediaUrl } from '@/lib/config';

/**
 * How a case study will read on capabiliq.com.
 *
 * This mirrors the public page at app/insights/case-studies/[slug] — the same
 * dark ground, the same accent, the same constraint/response/outcome columns —
 * so an editor can judge the writing in the shape a visitor will meet it,
 * rather than as a column of form fields.
 *
 * It is a representation, not the real page: it renders inside the panel and
 * cannot import the public site's components. When the two layouts diverge,
 * the public page is the authority and this should be brought back in line.
 */
const ACCENT = '#ff825d';

const Empty = ({ children }: { children: string }) => (
  <span className="italic text-white/30">{children}</span>
);

export default function CaseStudyPreview({ study }: { study: CaseStudyDraft }) {
  const cover = mediaUrl(study.coverImage?.url, study.coverImage?.key);
  const results = (study.results ?? []).filter((row) => row.label.trim() && row.value.trim());
  const services = study.services ?? [];

  const anatomy = [
    ['01', 'The challenge', study.challenge],
    ['02', 'The response', study.response],
    ['03', 'The outcome', study.outcome],
  ] as const;

  return (
    <div className="bg-[#0d0d0f] text-white">
      {/* ------------------------------- hero ------------------------------- */}
      <header className="relative min-h-[420px]">
        {cover ? (
          // A plain <img> rather than next/image: the source is the API's media
          // host and this never ships to a visitor, so optimisation is noise.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[#1a1a1f] text-[13px] text-white/35">
            No cover image yet
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,10,.96)_0%,rgba(8,8,10,.78)_46%,rgba(8,8,10,.2)_80%),linear-gradient(0deg,rgba(8,8,10,.92)_0%,transparent_56%)]" />

        <div className="relative flex min-h-[420px] flex-col justify-end p-10">
          <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            Case studies
            {study.sector && <span className="text-white/40"> / {study.sector}</span>}
          </p>

          <h1 className="max-w-3xl text-[42px] font-semibold leading-[0.95] tracking-[-0.05em]">
            {study.title.trim() || <Empty>Untitled case study</Empty>}
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/68">
            {study.summary?.trim() || <Empty>The summary appears here — it is also the card text on the index.</Empty>}
          </p>

          <dl className="mt-9 flex flex-wrap gap-x-9 gap-y-4 border-t border-white/25 pt-5 text-[13px]">
            {[
              ['Client', study.client?.trim() || 'Anonymised'],
              ['Sector', study.sector?.trim() || '—'],
              ['Services', services.length ? services.join(' · ') : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  {label}
                </dt>
                <dd className="mt-1.5 font-semibold text-white/85">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* ---------------------------- the engagement ------------------------ */}
      <section className="bg-[#efe9df] p-10 text-[#171719]">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#c84d31]">Engagement anatomy</p>
        <h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.05em]">From constraint to delivery.</h2>

        <div className="mt-8 grid border-t border-[#171719]/30 md:grid-cols-3">
          {anatomy.map(([number, label, copy]) => (
            <div
              key={number}
              className="border-b border-[#171719]/30 py-6 md:border-b-0 md:border-r md:px-6 md:last:border-r-0"
            >
              <span className="text-[13px] font-bold text-[#c84d31]">{number}</span>
              <h3 className="mt-6 text-lg font-semibold">{label}</h3>
              <p className="mt-3 text-[14px] leading-6 text-[#635d57]">
                {copy?.trim() || <span className="italic text-[#635d57]/45">Not written yet — required before publishing.</span>}
              </p>
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <dl className="mt-10 grid gap-6 border-t border-[#171719]/30 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((result, index) => (
              <div key={`${result.label}-${index}`}>
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c84d31]">{result.label}</dt>
                <dd className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{result.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* ------------------------------- body -------------------------------- */}
      {/* Light ground, matching the public page: long-form reading works better
          on light, and the site's own body styles are written for it. */}
      {study.contentHtml?.replace(/<[^>]+>/g, '').trim() && (
        <section className="bg-[#f3f0ec] p-10">
          <div
            className="preview-body mx-auto max-w-2xl text-[15px] leading-8 text-[#171019]/[0.78]"
            dangerouslySetInnerHTML={{ __html: study.contentHtml }}
          />
        </section>
      )}

      {/* ------------------------------- quote ------------------------------- */}
      {study.testimonial?.quote?.trim() && (
        <section className="bg-[#5b39d1] p-12 text-center">
          <span aria-hidden="true" className="text-5xl font-semibold leading-none" style={{ color: ACCENT }}>
            &ldquo;
          </span>
          <blockquote className="mx-auto -mt-3 max-w-2xl text-2xl font-medium leading-tight tracking-[-0.035em]">
            {study.testimonial.quote}
          </blockquote>
          {(study.testimonial.authorName || study.testimonial.authorRole) && (
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
              {[study.testimonial.authorName, study.testimonial.authorRole].filter(Boolean).join(' · ')}
            </p>
          )}
        </section>
      )}

      <section className="grid bg-[#ff825d] p-10 text-[#171719]">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em]">
          Your next case study starts with a real constraint
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Tell us what needs to work better.</h2>
      </section>
    </div>
  );
}
