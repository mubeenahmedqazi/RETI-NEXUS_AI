'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Lock, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/Common/Button';
import { FormField } from '@/components/ui/FormField';
import PatientProfilePicker, { PatientProfile } from './PatientProfilePicker';

interface SwitchProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  currentPatientId: string;
}

/**
 * Lets a signed-in patient jump to another patient profile registered on the
 * same phone number (e.g. a family member the same doctor scanned). Switching
 * still requires that other profile's own password — sharing a phone number
 * doesn't grant access to someone else's report without their credentials.
 */
export default function SwitchProfileModal({ isOpen, onClose, phone, currentPatientId }: SwitchProfileModalProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [target, setTarget] = useState<PatientProfile | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !phone) return;
    setLoadingProfiles(true);
    setTarget(null);
    setPassword('');
    setError('');
    fetch(`/api/auth/patient-lookup?phone=${phone}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch(() => setError('Could not load profiles for this number.'))
      .finally(() => setLoadingProfiles(false));
  }, [isOpen, phone]);

  const handleSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: phone, password, role: 'patient', patientId: target.id }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        onClose();
        router.push('/patient/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const otherProfiles = profiles.filter((p) => p.id !== currentPatientId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-lg surface rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b bg-gradient-to-r from-[var(--brand-secondary)]/8 to-[var(--brand-accent)]/8" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <Users className="w-5 h-5 text-[var(--brand-secondary)]" />
                  Switch Profile
                </h2>
                <button onClick={onClose} className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors duration-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--subtle-foreground)' }}>Other patients registered on {phone}</p>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {error && (
                <div className="bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg p-3 text-sm mb-4">
                  {error}
                </div>
              )}

              {loadingProfiles ? (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading profiles…</div>
              ) : !target ? (
                otherProfiles.length === 0 ? (
                  <div className="py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No other patients are registered on this phone number.
                  </div>
                ) : (
                  <PatientProfilePicker profiles={otherProfiles} onSelect={setTarget} />
                )
              ) : (
                <form onSubmit={handleSwitch} className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--muted)]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-accent)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {target.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{target.name}</p>
                      <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Enter their password to switch</p>
                    </div>
                  </div>

                  <FormField
                    label="Password"
                    required
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    endAdornment={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--subtle-foreground)] hover:text-[var(--foreground)] transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setTarget(null)} icon={<ArrowLeft className="w-4 h-4" />}>
                      Back
                    </Button>
                    <Button type="submit" variant="primary" loading={submitting} className="flex-1" icon={<LogIn className="w-4 h-4" />} glow>
                      Switch to {target.name.split(' ')[0]}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
