'use client';

import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  required?: boolean;
  endAdornment?: ReactNode;
}

export function FormField({ label, icon: Icon, required, endAdornment, className, ...props }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />}
        <input
          className={cn(
            'w-full surface rounded-lg py-2.5 text-sm ring-focus outline-none transition-all',
            Icon ? 'pl-10 pr-4' : 'px-4',
            endAdornment && 'pr-10',
            className
          )}
          style={{ color: 'var(--foreground)' }}
          {...props}
        />
        {endAdornment && <div className="absolute right-3 top-1/2 -translate-y-1/2">{endAdornment}</div>}
      </div>
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
}

export function SelectField({ label, required, className, children, ...props }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        className={cn('w-full surface rounded-lg px-4 py-2.5 text-sm ring-focus outline-none', className)}
        style={{ color: 'var(--foreground)' }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
