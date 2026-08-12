'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Phone, Calendar, Sun, Moon, Bell, LogOut, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function PatientSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setPatient(data))
      .finally(() => setLoading(false));

    const stored = localStorage.getItem('retinexus-notifications');
    if (stored !== null) setNotifications(stored === 'true');
  }, []);

  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('retinexus-notifications', String(next));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
    router.push('/login');
    router.refresh();
  };

  const fields = [
    { icon: User, label: 'Full Name', value: patient?.name },
    { icon: Phone, label: 'Phone', value: patient?.phone },
    { icon: Calendar, label: 'Age', value: patient?.age },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, appearance and preferences" />

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <ShieldCheck className="w-5 h-5 text-[var(--brand-secondary)]" /> Account Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                  <f.icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--subtle-foreground)' }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{f.label}</p>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{f.value || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="surface rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Appearance</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setTheme('light')}
                className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300"
                style={{ borderColor: theme === 'light' ? 'var(--brand-secondary)' : 'var(--border)' }}
              >
                <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                  <Sun className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Light</p>
                  <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Clinical, bright interface</p>
                </div>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300"
                style={{ borderColor: theme === 'dark' ? 'var(--brand-secondary)' : 'var(--border)' }}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Dark</p>
                  <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Low-light, futuristic interface</p>
                </div>
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--brand-secondary)]/10">
                  <Bell className="w-4 h-4 text-[var(--brand-secondary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Report notifications</p>
                  <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Get notified when a new report is available</p>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className="relative w-12 h-7 rounded-full transition-colors duration-300"
                style={{ background: notifications ? 'var(--brand-secondary)' : 'var(--border)' }}
              >
                <motion.span
                  className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow"
                  animate={{ x: notifications ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="surface rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Session</h3>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 hover:bg-red-500/20 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" /> Sign out of Retinexus AI
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}
