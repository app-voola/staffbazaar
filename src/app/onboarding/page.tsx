import Link from 'next/link';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  return (
    <>
      <nav style={{ padding: '20px 32px', borderBottom: '1px solid var(--sand)' }}>
        <Link
          href="/dashboard"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            color: 'var(--charcoal)',
            textDecoration: 'none',
          }}
        >
          Staff<em style={{ color: 'var(--ember)', fontStyle: 'italic' }}>Bazaar</em>
        </Link>
      </nav>
      <OnboardingWizard />
    </>
  );
}
