import Link from 'next/link';
import JobForm, { type JobDraft } from '@/components/JobForm';
import { Card, PageHeader } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Edit job' };
export const dynamic = 'force-dynamic';

type Job = JobDraft & { _id: string };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // the list endpoint is the read path recruiters already have permission for
  const result = await apiFetch<Job[]>(`/admin/jobs?limit=200`);
  const job = result.ok ? result.data.find((j) => j._id === id) : undefined;

  if (!job) {
    return (
      <>
        <PageHeader title="Edit job" />
        <Card>
          <p className="text-[15px] text-ink-600">
            {result.ok ? 'That job no longer exists.' : result.error}
          </p>
          <Link href="/jobs" className="btn-ghost mt-4">
            Back to jobs
          </Link>
        </Card>
      </>
    );
  }

  return <JobForm jobId={id} initial={job} />;
}
