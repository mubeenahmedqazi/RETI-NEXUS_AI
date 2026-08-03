'use client';

import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className={`relative inline-flex items-center h-9 w-16 rounded-full border transition-colors duration-300 ${
        isDark ? 'bg-slate-800 border-white/10' : 'bg-slate-100 border-slate-200'
      } ${className || ''}`}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md bg-white dark:bg-slate-900"
        animate={{ x: isDark ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-cyan-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </motion.span>
    </button>
  );
}
