import Link from 'next/link';
import ApplicationDetailView from '@/components/ApplicationDetailView';
import { Card } from '@/components/ui';

export const metadata = { title: 'Application' };
export const dynamic = 'force-dynamic';

/**
 * A single application on its own page. The "new application" alert email links
 * straight here, so a recruiter can open a candidate from their inbox without
 * hunting for them in the table.
 */
export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <p className="mb-4 text-[15px] text-ink-500">
        <Link href="/applications" className="text-brand-700 hover:underline">
          ← All applications
        </Link>
      </p>

      <Card padded={false}>
        <ApplicationDetailView applicationId={id} />
      </Card>
    </>
  );
}
