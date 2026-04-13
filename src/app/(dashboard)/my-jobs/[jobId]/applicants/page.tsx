import { JobApplicantsClient } from './JobApplicantsClient';

interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function JobApplicantsPage({ params }: Props) {
  const { jobId } = await params;
  return <JobApplicantsClient jobId={jobId} />;
}
