import { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { TaskPriority, WorkspaceRole } from '@/types';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold font-mono uppercase tracking-wide',
        className
      )}
    >
      {children}
    </span>
  );
}

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-moss-light text-moss',
  medium: 'bg-blueprint-light text-blueprint',
  high: 'bg-amber-light text-amber',
  urgent: 'bg-coral-light text-coral',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge className={priorityStyles[priority]}>{priority}</Badge>;
}

const roleStyles: Record<WorkspaceRole, string> = {
  owner: 'bg-blueprint text-white',
  admin: 'bg-blueprint-light text-blueprint',
  member: 'bg-paper-dark text-ink-soft',
};

export function RoleBadge({ role }: { role: WorkspaceRole }) {
  return <Badge className={roleStyles[role]}>{role}</Badge>;
}
