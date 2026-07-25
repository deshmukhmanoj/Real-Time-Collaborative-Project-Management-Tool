import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { FiLoader } from 'react-icons/fi';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blueprint text-white hover:bg-blueprint-deep active:bg-blueprint-deep disabled:bg-blueprint/50',
  secondary:
    'bg-white text-ink border border-line hover:border-ink-faint hover:bg-paper disabled:opacity-50',
  ghost: 'bg-transparent text-ink-soft hover:bg-ink/5 hover:text-ink disabled:opacity-50',
  danger: 'bg-coral text-white hover:bg-coral/90 disabled:bg-coral/50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium rounded transition-colors duration-150',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <FiLoader className="animate-spin" /> : icon}
      {children}
    </button>
  );
}