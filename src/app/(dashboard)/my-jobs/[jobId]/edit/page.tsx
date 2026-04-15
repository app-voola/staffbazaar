import { EditJobClient } from './EditJobClient';

interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function EditJobPage({ params }: Props) {
  const { jobId } = await params;
  return <EditJobClient jobId={jobId} />;
}
