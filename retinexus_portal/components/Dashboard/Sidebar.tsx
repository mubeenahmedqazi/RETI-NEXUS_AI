'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Upload,
  Users,
  FolderOpen,
  Settings,
  LogOut,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Upload, label: 'Upload Scan', href: '/dashboard/upload' },
  { icon: Users, label: 'Patients', href: '/dashboard/patients' },
  { icon: FolderOpen, label: 'Reports', href: '/dashboard/reports' },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [doctorName, setDoctorName] = useState('Doctor');

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setDoctorName(data.name || 'Doctor');
        }
      } catch (error) {
        console.error('Failed to fetch doctor info:', error);
      }
    };
    fetchDoctorInfo();
  }, []);

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.aside
      className={`fixed left-0 top-0 h-full z-50 overflow-hidden border-r rounded-r-[22px]`}
      style={{
        width: isOpen ? 240 : 70,
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      }}
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 20 }}
    >
      {/* Logo Section — eye on the left, wordmark/tagline on the right, one rounded cyan frame */}
      <div className="flex items-center justify-center py-5 border-b relative" style={{ borderColor: 'var(--border)' }}>
        <Link href="/dashboard" className="flex items-center justify-center">
          <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.3 }}>
            {isOpen ? (
              <Logo size={48} withWordmark withTagline />
            ) : (
              <Logo size={44} />
            )}
          </motion.div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1 relative h-[calc(100%-236px)] overflow-y-auto scrollbar-thin">
        {menuItems.map((item, index) => {
          const isActive = isActiveLink(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, type: 'spring' }}
              whileHover={{ x: 3 }}
            >
              <Link href={item.href} className="relative block">
                <motion.div
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--brand-secondary)]/12 to-[var(--brand-accent)]/12 border'
                      : 'hover:bg-[var(--muted)] border border-transparent'
                  }`}
                  style={isActive ? { borderColor: 'var(--brand-accent)', opacity: 1 } : undefined}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon
                    className="w-4 h-4 flex-shrink-0 transition-colors duration-300"
                    style={{ color: isActive ? 'var(--brand-accent)' : 'var(--muted-foreground)' }}
                  />
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="text-sm font-medium"
                      style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div
                      className="absolute right-2 w-1 h-6 rounded-full bg-gradient-to-b from-[var(--brand-secondary)] to-[var(--brand-accent)]"
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isOpen ? '' : 'flex flex-col items-center'}`}
        style={{ borderColor: 'var(--border)' }}
      >
        {isOpen ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 py-1">
              <div className="min-w-0">
                <p className="text-[11px]" style={{ color: 'var(--subtle-foreground)' }}>Signed in as</p>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{doctorName}</p>
              </div>
              <ThemeToggle />
            </div>

            <button
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl hover:bg-[var(--muted)] transition-all duration-300 text-sm group"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>Settings</span>
            </button>

            <button
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl hover:bg-red-500/10 transition-all duration-300 text-sm text-[var(--muted-foreground)] hover:text-red-500 group"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform duration-300`} />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] flex items-center justify-center text-white text-xs font-bold">
              {doctorName.charAt(0).toUpperCase()}
            </div>
            <button
              className="flex justify-center p-2 rounded-xl hover:bg-[var(--muted)] transition-all duration-300 w-full"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              className="flex justify-center p-2 rounded-xl hover:bg-red-500/10 transition-all duration-300 text-[var(--muted-foreground)] hover:text-red-500 w-full"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
