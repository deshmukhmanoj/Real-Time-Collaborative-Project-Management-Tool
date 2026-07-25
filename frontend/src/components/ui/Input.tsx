import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint',
            'transition-colors duration-150',
            error ? 'border-coral' : 'border-line focus:border-blueprint',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-coral">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint',
            'transition-colors duration-150 resize-none',
            error ? 'border-coral' : 'border-line focus:border-blueprint',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-coral">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
