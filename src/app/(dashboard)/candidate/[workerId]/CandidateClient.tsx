'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { type MockWorker } from '@/services/mock/workers';
import { useWorkers } from '@/contexts/WorkersContext';
import { getWorkerProfile, type WorkerProfileDetail } from '@/services/mock/workerProfiles';
import { supabase } from '@/lib/supabase';
import { ProfileHero } from '@/components/candidate/ProfileHero';
import { StatsBanner } from '@/components/candidate/StatsBanner';
import { ExperienceTimeline } from '@/components/candidate/ExperienceTimeline';
import { NotesCard } from '@/components/candidate/NotesCard';
import { RatingCard } from '@/components/candidate/RatingCard';
import { ContactSideCard } from '@/components/candidate/ContactSideCard';
import { VerificationSideCard } from '@/components/candidate/VerificationSideCard';
import { ShortlistModal } from '@/components/staff/ShortlistModal';

interface WorkerProfileRow {
  worker_id: string;
  full_name: string | null;
  role: string | null;
  experience_years: number | null;
  city: string | null;
  cities: string[] | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  skills: string[] | null;
  salary_expected: number | null;
  looking_for_work: boolean | null;
  aadhaar_status: string | null;
  avatar_url: string | null;
}

interface WorkExpRow {
  id: string;
  job_title: string | null;
  restaurant: string | null;
  location: string | null;
  from_year: number | null;
  to_year: number | null;
  still_here: boolean | null;
}

function formatDate(from: number | null, to: number | null, stillHere: boolean | null): string {
  if (from && stillHere) return `${from} — Present`;
  if (from && to) return `${from} — ${to}`;
  if (from) return `${from}`;
  return '';
}

function yearsBetween(from: number | null, to: number | null, stillHere: boolean | null): number {
  if (!from) return 0;
  const end = stillHere ? new Date().getFullYear() : to ?? from;
  return Math.max(0, end - from);
}

export function CandidateClient({ workerId }: { workerId: string }) {
  const { getById, loading: workersLoading } = useWorkers();
  const worker = getById(workerId);
  const [profile, setProfile] = useState<WorkerProfileDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [shortlistOpen, setShortlistOpen] = useState<MockWorker | null>(null);
  const [toast, setToast] = useState('');

  const loadProfile = useCallback(async () => {
    const [profileRes, expsRes] = await Promise.all([
      supabase.from('worker_profiles').select('*').eq('worker_id', workerId).maybeSingle(),
      supabase
        .from('work_experience')
        .select('id, job_title, restaurant, location, from_year, to_year, still_here')
        .eq('worker_id', workerId)
        .order('from_year', { ascending: false }),
    ]);

    if (profileRes.error) console.error('[candidate] worker_profiles load failed', profileRes.error);
    if (expsRes.error) console.error('[candidate] work_experience load failed', expsRes.error);

    const p = profileRes.data;
    const exps = expsRes.data;
    console.debug('[candidate] loaded', { workerId, hasProfile: !!p, expCount: exps?.length ?? 0 });

    // If no real profile row exists (mock seed worker), fall back to default
    if (!p) {
      setProfile(getWorkerProfile(workerId));
      return;
    }

    const row = p as WorkerProfileRow;
    const expRows = (exps ?? []) as WorkExpRow[];

    const detail: WorkerProfileDetail = {
      workerId,
      area: row.city ?? row.cities?.[0] ?? '',
      languages: [],
      cuisines: (row.skills ?? []).map((s) => ({ name: s, years: row.experience_years ?? 0 })),
      experience: expRows.map((e) => ({
        years: yearsBetween(e.from_year, e.to_year, e.still_here),
        role: e.job_title ?? '',
        place: [e.restaurant, e.location].filter(Boolean).join(', '),
        date: formatDate(e.from_year, e.to_year, e.still_here),
      })),
      email: row.email ?? '',
      verifications: {
        aadhaar: row.aadhaar_status === 'verified',
        phone: !!row.phone,
        background: false,
      },
      willingStates: row.cities ?? [],
    };

    setProfile(detail);
  }, [workerId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setProfileLoading(true);
      await loadProfile();
      if (cancelled) return;
      setProfileLoading(false);
    })();

    const ch = supabase
      .channel(`candidate-${workerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_profiles', filter: `worker_id=eq.${workerId}` },
        () => {
          loadProfile();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_experience', filter: `worker_id=eq.${workerId}` },
        () => {
          loadProfile();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [workerId, loadProfile]);

  if (workersLoading || profileLoading || !profile) {
    return (
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 16 }}>Loading…</h1>
    );
  }

  if (!worker) {
    return (
      <>
        <Link href="/browse-staff" style={{ color: 'var(--ember)', fontWeight: 700 }}>
          ← Back
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 16 }}>
          Worker not found
        </h1>
      </>
    );
  }

  return (
    <>
      <Link
        href="/browse-staff"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--charcoal-light)',
          textDecoration: 'none',
          marginBottom: 18,
        }}
      >
        ← Back
      </Link>

      <ProfileHero worker={worker} profile={profile} onAddToJob={() => setShortlistOpen(worker)} />
      <StatsBanner
        worker={worker}
        experienceYears={
          profile.experience.length
            ? profile.experience.reduce((s, e) => s + e.years, 0)
            : undefined
        }
      />

      <div className="detail-cols">
        <div>
          <ExperienceTimeline items={profile.experience} />
          <RatingCard workerId={workerId} />
          <NotesCard workerId={workerId} />
        </div>
        <aside>
          <ContactSideCard worker={worker} profile={profile} />
          <VerificationSideCard profile={profile} />
        </aside>
      </div>

      <ShortlistModal
        worker={shortlistOpen}
        onClose={() => setShortlistOpen(null)}
        onPicked={(jobTitle) => {
          setToast(`${shortlistOpen?.name} added to ${jobTitle}`);
          setShortlistOpen(null);
          setTimeout(() => setToast(''), 2200);
        }}
      />

      {toast && (
        <div className="sb-toast show">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}

      <style>{`
        .detail-cols { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
        @media (max-width: 968px) { .detail-cols { grid-template-columns: 1fr; } }
        .sb-toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: var(--charcoal); color: white; padding: 14px 22px; border-radius: 100px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-lg); z-index: 400; }
        .sb-toast svg { width: 18px; height: 18px; color: var(--green); }
      `}</style>
    </>
  );
}
