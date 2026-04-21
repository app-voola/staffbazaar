import { supabase } from './supabase';

interface JobLike {
  id: string;
  role: string;
  owner_id: string;
  title?: string | null;
  restaurant_name?: string | null;
  restaurant_cover?: string | null;
}

interface UserLike {
  id: string;
  full_name?: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'R';
}

function timeLabel(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export async function applyToJob(user: UserLike, job: JobLike): Promise<{ error: string | null }> {
  const workerName = user.full_name && user.full_name !== 'Owner' ? user.full_name : 'Worker';
  const applicantId = `${job.id}-${user.id}-${Date.now()}`;
  const { error: appErr } = await supabase.from('applicants').insert({
    id: applicantId,
    job_id: job.id,
    worker_id: user.id,
    name: workerName,
    role: job.role,
    stage: 'applied',
    initials: (workerName[0] ?? 'W').toUpperCase(),
  });
  if (appErr) return { error: appErr.message };

  const restName = job.restaurant_name || job.title || 'Restaurant';
  const convId = `conv-${user.id}-${job.owner_id}`;

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', convId)
    .maybeSingle();

  if (!existing) {
    const welcomeText = `Thanks for your interest in the ${job.role} role at ${restName}. We will review your application and get back to you shortly.`;
    // Owner views this conversation so we store the *worker's* display
    // name here; the worker's UI derives the restaurant name from owner_id.
    await supabase.from('conversations').insert({
      id: convId,
      worker_id: user.id,
      owner_id: job.owner_id,
      name: workerName,
      role: job.role,
      avatar: null,
      initials: initials(workerName),
      last_message: welcomeText,
      time: timeLabel(),
      unread: 1,
      type: 'active',
    });

    await supabase.from('messages').upsert(
      [
        {
          id: `${convId}-greeting`,
          conversation_id: convId,
          from_me: false,
          text: `Hi, I just applied for the ${job.role} position. Looking forward to hearing from you!`,
          time: timeLabel(),
        },
        {
          id: `${convId}-welcome`,
          conversation_id: convId,
          from_me: true,
          text: welcomeText,
          time: timeLabel(),
        },
      ],
      { onConflict: 'id' },
    );
  }

  return { error: null };
}
