import { Suspense } from 'react';
import { MyJobsClient } from './MyJobsClient';

export default function MyJobsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Loading…</div>}>
      <MyJobsClient />
    </Suspense>
  );
}
