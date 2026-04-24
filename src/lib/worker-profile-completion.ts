/**
 * Shared worker-profile completion logic.
 *
 * All surfaces (Edit Profile banner, Dashboard banner, sidebar warning
 * badge) need to agree on "complete" — otherwise the profile page says
 * 100% while the sidebar and dashboard still show an "!" warning.
 */

export interface CompletionInput {
  full_name?: string | null;
  role?: string | null;
  aadhaar_status?: string | null;
  experience_years?: number | null;
  cities?: string[] | null;
  skills?: string[] | null;
  work_experience_rows?: number;
}

export function completionChecks(p: CompletionInput | null | undefined): boolean[] {
  const role = (p?.role ?? '').toLowerCase();
  const isChef = /chef|cook/.test(role);
  const hasExperience =
    (p?.work_experience_rows ?? 0) > 0 ||
    (p?.experience_years ?? 0) > 0;
  return [
    !!(p?.full_name ?? '').trim(),
    (p?.aadhaar_status ?? 'none') !== 'none',
    hasExperience,
    (p?.cities ?? []).length > 0,
    isChef ? (p?.skills ?? []).length > 0 : true,
  ];
}

export function completionPercent(p: CompletionInput | null | undefined): number {
  const checks = completionChecks(p);
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function isProfileComplete(p: CompletionInput | null | undefined): boolean {
  return completionPercent(p) === 100;
}
