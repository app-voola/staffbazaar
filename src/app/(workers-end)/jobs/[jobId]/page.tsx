import { JobDetailClient } from './JobDetailClient';

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <JobDetailClient jobId={jobId} />;
}
