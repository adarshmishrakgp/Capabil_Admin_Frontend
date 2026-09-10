import CaseStudyForm from '@/components/CaseStudyForm';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'New case study' };
export const dynamic = 'force-dynamic';

export default async function NewCaseStudyPage() {
  // The sector suggestions degrade to an empty list rather than blocking the
  // page — a study can be written and saved without matching an existing sector.
  const sectors = await apiFetch<string[]>('/admin/case-studies/sectors');

  return <CaseStudyForm sectors={sectors.ok ? sectors.data : []} />;
}
