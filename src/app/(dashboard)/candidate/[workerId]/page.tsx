import { CandidateClient } from './CandidateClient';

interface Props {
  params: Promise<{ workerId: string }>;
}

export default async function CandidateDetailPage({ params }: Props) {
  const { workerId } = await params;
  return <CandidateClient workerId={workerId} />;
}
