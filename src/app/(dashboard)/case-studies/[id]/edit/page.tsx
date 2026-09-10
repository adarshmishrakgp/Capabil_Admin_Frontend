import Link from 'next/link';
import CaseStudyForm, { type CaseStudyDraft } from '@/components/CaseStudyForm';
import { Card, PageHeader } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Edit case study' };
export const dynamic = 'force-dynamic';

export default async function EditCaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [result, sectors] = await Promise.all([
    apiFetch<CaseStudyDraft>(`/admin/case-studies/${id}`),
    apiFetch<string[]>('/admin/case-studies/sectors'),
  ]);

  if (!result.ok) {
    return (
      <>
        <PageHeader title="Edit case study" />
        <Card>
          <p className="text-[15px] text-ink-600">{result.error}</p>
          <Link href="/case-studies" className="btn-ghost mt-4">
            Back to case studies
          </Link>
        </Card>
      </>
    );
  }

  return <CaseStudyForm caseStudyId={id} initial={result.data} sectors={sectors.ok ? sectors.data : []} />;
}
