import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

export function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return format(new Date(dateStr), 'MMM d');
}

export function isOverdue(dateStr: string | null, isCompleted: boolean): boolean {
  if (!dateStr || isCompleted) return false;
  const date = new Date(dateStr);
  return isPast(date) && !isToday(date);
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatTimestamp(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy · h:mm a');
}
