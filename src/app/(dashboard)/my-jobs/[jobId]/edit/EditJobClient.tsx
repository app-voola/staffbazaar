'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useJobs } from '@/contexts/JobsContext';
import type { MockJob } from '@/services/mock/jobs';

type JobStatus = MockJob['status'];

interface FormState {
  title: string;
  role: string;
  status: JobStatus;
  salaryMin: string;
  salaryMax: string;
  shift: string;
  jobType: string;
  tips: boolean;
  description: string;
}

const EMPTY: FormState = {
  title: '',
  role: '',
  status: 'active',
  salaryMin: '',
  salaryMax: '',
  shift: 'Evening',
  jobType: 'Full-time',
  tips: false,
  description: '',
};

export function EditJobClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { jobs, updateJob, loading } = useJobs();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    const job = jobs.find((j) => j.id === jobId);
    if (!job) {
      setFound(false);
      return;
    }
    setFound(true);
    setForm({
      title: job.title,
      role: job.role,
      status: job.status,
      salaryMin: String(job.salaryMin),
      salaryMax: String(job.salaryMax),
      shift: job.shift || 'Evening',
      jobType: job.jobType || 'Full-time',
      tips: job.tips,
      description: job.description,
    });
  }, [jobs, jobId, loading]);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updateJob(jobId, {
        title: form.title.trim(),
        role: form.role.trim(),
        status: form.status,
        salaryMin: parseInt(form.salaryMin || '0', 10),
        salaryMax: parseInt(form.salaryMax || '0', 10),
        shift: form.shift,
        jobType: form.jobType,
        tips: form.tips,
        description: form.description,
      });
      router.push('/my-jobs');
    } catch (err) {
      setBusy(false);
      setError((err as Error).message || 'Save failed');
    }
  };

  if (loading || found === null) {
    return <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Loading…</h1>;
  }

  if (!found) {
    return (
      <>
        <Link href="/my-jobs" style={{ color: 'var(--ember)', fontWeight: 700 }}>
          ← Back
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 16 }}>
          Job not found
        </h1>
      </>
    );
  }

  return (
    <div className="edit-job-page">
      <Link href="/my-jobs" className="back-link">
        ← Back to My Jobs
      </Link>
      <h1 className="edit-heading">Edit Job</h1>

      <form onSubmit={onSave} noValidate>
        <div className="form-section">
          <h3>Basics</h3>
          <div className="field">
            <label>Job Title</label>
            <input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Role / Category</label>
            <input
              value={form.role}
              placeholder="Cooks & Chefs, Waiters, etc."
              onChange={(e) => update({ role: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => update({ status: e.target.value as JobStatus })}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Compensation</h3>
          <div className="form-row">
            <div className="field">
              <label>Salary Min (₹)</label>
              <input
                type="number"
                value={form.salaryMin}
                onChange={(e) => update({ salaryMin: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Salary Max (₹)</label>
              <input
                type="number"
                value={form.salaryMax}
                onChange={(e) => update({ salaryMax: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Shift</label>
              <select value={form.shift} onChange={(e) => update({ shift: e.target.value })}>
                <option>Morning</option>
                <option>Evening</option>
                <option>Night</option>
                <option>Flexible</option>
              </select>
            </div>
            <div className="field">
              <label>Job Type</label>
              <select value={form.jobType} onChange={(e) => update({ jobType: e.target.value })}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </div>
          </div>
          <div className="toggle-row">
            <div className="toggle-label">Tips included</div>
            <button
              type="button"
              className={`toggle-switch${form.tips ? ' on' : ''}`}
              onClick={() => update({ tips: !form.tips })}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Description</h3>
          <div className="field">
            <textarea
              rows={6}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <div className="actions-row">
          <Link href="/my-jobs" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <style>{`
        .edit-job-page { max-width: 720px; padding-bottom: 80px; }
        .back-link { display: inline-block; font-size: 13px; font-weight: 600; color: var(--ember); text-decoration: none; margin-bottom: 16px; }
        .back-link:hover { text-decoration: underline; }
        .edit-heading { font-family: var(--font-display); font-size: 32px; margin-bottom: 24px; }
        .form-section { margin-bottom: 32px; }
        .form-section h3 { font-family: var(--font-display); font-size: 20px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--sand); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 13px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
        .field input, .field select, .field textarea { width: 100%; padding: 12px 14px; border: 1.5px solid var(--sand); border-radius: var(--radius-md); background: white; font-size: 14px; font-family: var(--font-body); color: var(--charcoal); transition: border-color 0.2s; box-sizing: border-box; }
        .field input:focus, .field select:focus, .field textarea:focus { outline: none; border-color: var(--ember); }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; }
        .toggle-label { font-size: 14px; font-weight: 600; color: var(--charcoal); }
        .toggle-switch { width: 48px; height: 26px; background: var(--sand); border-radius: 100px; position: relative; cursor: pointer; transition: background 0.2s; border: none; flex-shrink: 0; }
        .toggle-switch::after { content: ''; width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: transform 0.2s; }
        .toggle-switch.on { background: var(--ember); }
        .toggle-switch.on::after { transform: translateX(22px); }
        .error-text { color: #DC2626; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
        .actions-row { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
        .btn-ghost { padding: 12px 24px; border-radius: 100px; background: white; color: var(--charcoal); border: 1.5px solid var(--sand); font-size: 14px; font-weight: 700; text-decoration: none; cursor: pointer; }
        .btn-ghost:hover { background: var(--cream); }
        .btn-primary { padding: 12px 28px; border-radius: 100px; background: var(--ember); color: white; border: none; font-size: 14px; font-weight: 700; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
        .btn-primary:hover:not(:disabled) { background: #C7421A; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(220,74,26,0.28); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
