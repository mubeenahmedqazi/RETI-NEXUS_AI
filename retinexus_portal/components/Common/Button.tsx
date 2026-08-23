'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';
import clsx from 'clsx';
import { Swirling } from '../ui/Swirling';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  glow?: boolean;
  children: ReactNode;
}

type MotionButtonProps = ButtonProps & MotionProps;

const Button = forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      loading = false,
      fullWidth = false,
      glow = false,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        'bg-gradient-to-r from-[var(--brand-secondary)] via-sky-500 to-[var(--brand-accent)] text-white shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30 hover:scale-105 active:scale-95',
      secondary:
        'surface text-[var(--foreground)] hover:bg-[var(--muted)] hover:border-[var(--brand-accent)]/40 hover:scale-105 active:scale-95',
      outline:
        'border-2 border-[var(--brand-secondary)] text-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)]/10 hover:scale-105 active:scale-95',
      ghost:
        'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] hover:scale-105 active:scale-95',
      danger:
        'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95',
      success:
        'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95',
      warning:
        'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95',
    };

    const sizeClasses = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-5 text-sm',
      lg: 'h-14 px-7 text-base',
      xl: 'h-16 px-8 text-lg',
    };

    const glowClasses = glow
      ? 'relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-cyan-500/30 before:via-sky-500/30 before:to-indigo-600/30 before:blur-xl before:-z-10'
      : '';

    const baseClasses = clsx(
      'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
      'transition-all duration-300 ease-out cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--background)]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      glowClasses,
      className
    );

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.03, y: -2 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
        className={baseClasses}
        {...props}
      >
        {loading ? (
          <>
            <Swirling className="h-5 w-5" style={{ color: 'var(--brand-secondary)' }} />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {icon}
            {children}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;