import Link from 'next/link';
import JobForm, { type JobDraft } from '@/components/JobForm';
import { Card, PageHeader } from '@/components/ui';
import { apiFetch } from '@/lib/server-api';

export const metadata = { title: 'Edit job' };
export const dynamic = 'force-dynamic';

type Job = JobDraft & { _id: string };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The detail endpoint takes the same jobs:read permission as the list, and
  // reads one document instead of scanning the first page of every job.
  const result = await apiFetch<{ job: Job }>(`/admin/jobs/${id}`);
  const job = result.ok ? result.data.job : undefined;

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
