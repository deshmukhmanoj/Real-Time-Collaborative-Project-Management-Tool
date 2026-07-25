import { cn } from '@/utils/cn';

const PALETTE = ['#2B5F8A', '#5C8A62', '#DB9A3C', '#C6503F', '#6B5B95', '#3D8C84'];

function colorForName(name: string): string {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  title?: string;
}

const sizeMap = { xs: 'w-5 h-5 text-[10px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm' };

export function Avatar({ name, size = 'sm', className, title }: AvatarProps) {
  return (
    <div
      title={title || name}
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none',
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: colorForName(name) }}
    >
      {initials(name)}
    </div>
  );
}
