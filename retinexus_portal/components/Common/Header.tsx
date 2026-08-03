'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Sparkles } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <motion.header
      className={`fixed top-0 right-0 left-0 z-40 transition-all duration-300 ${
        isScrolled ? 'glass border-b' : 'py-1'
      }`}
      style={{ borderColor: isScrolled ? 'var(--border)' : 'transparent' }}
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-2.5">
        <div className="flex items-center gap-2.5 flex-1 ml-10 lg:ml-0">
          <Logo size={40} animated={false} withWordmark className="lg:hidden" />
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="p-2 rounded-xl hover:bg-[var(--muted)] transition-colors duration-300 relative">
            <Bell className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <button className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-secondary)]/10 to-[var(--brand-accent)]/10 border" style={{ borderColor: 'var(--brand-accent)', opacity: 1 }}>
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
            <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>AI Active</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
