/**
 * Relative short time label for conversation lists.
 * Today → "10:32 AM"; yesterday → "Yesterday"; this year → "3 Apr";
 * older → "3 Apr 2024".
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Absolute chat-bubble time. Same day → "10:32 AM".
 * Other → "3 Apr, 10:32 AM" so older threads read sensibly.
 */
export function formatBubbleTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const timePart = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return timePart;
  const datePart = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
  return `${datePart}, ${timePart}`;
}
