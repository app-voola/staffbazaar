'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerI18n } from '@/contexts/WorkerI18nContext';
import { supabase } from '@/lib/supabase';

export function WorkStatusCard() {
  const { user } = useAuth();
  const { t } = useWorkerI18n();
  const [looking, setLooking] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('worker_profiles')
        .select('looking_for_work')
        .eq('worker_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) setLooking(data.looking_for_work !== false);
    })();

    const ch = supabase
      .channel(`work-status-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_profiles', filter: `worker_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { looking_for_work?: boolean } | null;
          if (row) setLooking(row.looking_for_work !== false);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const toggle = async () => {
    if (!user) return;
    const next = !looking;
    setLooking(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_job_status', next ? 'looking' : 'working');
    }
    await supabase
      .from('worker_profiles')
      .upsert(
        { worker_id: user.id, looking_for_work: next, updated_at: new Date().toISOString() },
        { onConflict: 'worker_id' },
      );
  };

  return (
    <div
      className={`work-status-card${looking ? ' on' : ''}`}
      role="switch"
      aria-checked={looking}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div className="work-status-info">
        <div className="work-status-heading">{t('work_status_heading')}</div>
        <div className="work-status-label">
          <span className="dot" /> {looking ? t('work_status_looking') : t('work_status_working')}
        </div>
      </div>
      <span className="work-status-toggle">
        <span className="knob" />
      </span>

      <style>{`
        .work-status-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; margin-top: 12px; background: white; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; cursor: pointer; transition: all 0.2s; outline: none; }
        .work-status-card:hover { border-color: var(--ember); }
        .work-status-card:focus-visible { box-shadow: 0 0 0 2px var(--ember-glow); }
        .work-status-info { flex: 1; min-width: 0; }
        .work-status-heading { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--stone); margin-bottom: 4px; }
        .work-status-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--charcoal); }
        .work-status-label .dot { width: 8px; height: 8px; border-radius: 50%; background: #9CA3AF; }
        .work-status-card.on .work-status-label .dot { background: #10B981; }

        .work-status-toggle { position: relative; width: 40px; height: 24px; border-radius: 100px; background: var(--sand); flex-shrink: 0; transition: background 0.25s; }
        .work-status-toggle .knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.18); transition: transform 0.25s; }
        .work-status-card.on .work-status-toggle { background: #10B981; }
        .work-status-card.on .work-status-toggle .knob { transform: translateX(16px); }
      `}</style>
    </div>
  );
}
