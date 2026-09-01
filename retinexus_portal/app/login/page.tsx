'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, signInWithPopup, AuthError } from 'firebase/auth';
import { Eye, EyeOff, Mail, Lock, LogIn, User, Stethoscope, UserCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import AuthShell from '@/components/Common/AuthShell';
import { FormField } from '@/components/ui/FormField';
import Button from '@/components/Common/Button';
import GoogleIcon from '@/components/ui/GoogleIcon';
import PatientProfilePicker, { PatientProfile } from '@/components/Patient/PatientProfilePicker';
import { isValidPhone } from '@/lib/utils';
import { auth, googleProvider } from '@/lib/firebase';

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': "Incorrect email or password. If you signed up with Google, use ‘Continue with Google’ instead — that account has no password set.",
  'auth/user-not-found': 'No account found with that email.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/configuration-not-found':
    'Email/Password sign-in is not enabled for this project yet — enable it in the Firebase Console under Authentication → Sign-in method.',
  'auth/operation-not-allowed':
    'This sign-in method is not enabled for this project yet — enable it in the Firebase Console under Authentication → Sign-in method.',
};

function friendlyFirebaseError(err: unknown): string {
  const code = (err as AuthError)?.code;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('Firebase auth error:', code, err);
  }
  return (code && FIREBASE_ERROR_MESSAGES[code]) || `Something went wrong${code ? ` (${code})` : ''}. Please try again.`;
}

type PatientStep = 'phone' | 'picker' | 'password';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The website's "Patient Login" link sends ?role=patient so visitors land on the right
  // tab directly, instead of always defaulting to Doctor.
  const [role, setRole] = useState<'doctor' | 'patient'>(() => (searchParams.get('role') === 'patient' ? 'patient' : 'doctor'));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Doctor flow — unchanged, single-step email + password
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Patient flow — phone number first, then (if needed) pick which profile
  // on that number, then that profile's own password.
  const [patientStep, setPatientStep] = useState<PatientStep>('phone');
  const [phone, setPhone] = useState('');
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [patientPassword, setPatientPassword] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const selectRole = (r: 'doctor' | 'patient') => {
    setRole(r);
    setError('');
    setPatientStep('phone');
    setProfiles([]);
    setSelectedProfile(null);
    setPatientPassword('');
  };

  const finishLogin = (data: any) => {
    sessionStorage.setItem('userId', data.userId);
    sessionStorage.setItem('userName', data.name);
    sessionStorage.setItem('userRole', data.role);
    router.push(data.role === 'DOCTOR' ? '/dashboard' : '/patient/dashboard');
    router.refresh();
  };

  // === DOCTOR: email/password via Firebase, then exchange the ID token for a session ===
  const exchangeFirebaseSession = async (idToken: string) => {
    const response = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok) {
      finishLogin(data);
    } else {
      setError(data.error || 'Invalid credentials');
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await credential.user.getIdToken();
      await exchangeFirebaseSession(idToken);
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      await exchangeFirebaseSession(idToken);
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  // === PATIENT: step 1, look up who's registered on this phone number ===
  const handlePhoneContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidPhone(phone)) {
      setError('Phone number must be exactly 11 digits');
      return;
    }

    setLookupLoading(true);
    try {
      const response = await fetch(`/api/auth/patient-lookup?phone=${phone}`, { credentials: 'include' });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      const found: PatientProfile[] = data.profiles || [];
      if (found.length === 0) {
        setError('No patient is registered on this number yet.');
      } else if (found.length === 1) {
        setSelectedProfile(found[0]);
        setPatientStep('password');
      } else {
        setProfiles(found);
        setPatientStep('picker');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  // === PATIENT: step 3, sign in as the selected profile ===
  const handlePatientPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: phone, password: patientPassword, role: 'patient', patientId: selectedProfile.id }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        finishLogin(data);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const backToPhone = () => {
    setPatientStep('phone');
    setProfiles([]);
    setSelectedProfile(null);
    setPatientPassword('');
    setError('');
  };

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to your account" subtitle="Access your clinical AI screening workspace">
      {/* Role Selection */}
      <div className="mb-6">
        <div className="flex rounded-xl p-1 bg-[var(--muted)]">
          {(['doctor', 'patient'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => selectRole(r)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300 ${
                role === r
                  ? 'bg-[var(--card)] shadow text-[var(--brand-secondary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {r === 'doctor' ? <Stethoscope className="w-4 h-4" /> : <UserCircle className="w-4 h-4" />}
              <span className="text-sm font-medium capitalize">{r}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg p-3 text-sm mb-6"
        >
          {error}
        </motion.div>
      )}

      {role === 'doctor' ? (
        <form onSubmit={handleDoctorSubmit} className="space-y-5">
          <FormField
            label="Email Address"
            required
            icon={Mail}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="doctor@hospital.com"
          />

          <FormField
            label="Password"
            required
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            endAdornment={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--subtle-foreground)] hover:text-[var(--foreground)] transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--muted-foreground)' }}>
              <input type="checkbox" className="rounded border-[var(--border)] text-[var(--brand-secondary)] focus:ring-[var(--brand-secondary)]" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-[var(--brand-secondary)] hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" fullWidth loading={loading} icon={<LogIn className="w-4 h-4" />} glow>
            Sign In as Doctor
          </Button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            loading={loading}
            icon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
        </form>
      ) : (
        <AnimatePresence mode="wait">
          {patientStep === 'phone' && (
            <motion.form
              key="phone"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePhoneContinue}
              className="space-y-5"
            >
              <FormField
                label="Phone Number"
                required
                icon={User}
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="0300-1234567"
              />
              <p className="text-xs -mt-2" style={{ color: 'var(--subtle-foreground)' }}>
                If more than one patient is registered on this number, you&apos;ll pick which one next.
              </p>
              <Button type="submit" variant="primary" fullWidth loading={lookupLoading} icon={<ArrowRight className="w-4 h-4" />} glow>
                Continue
              </Button>
            </motion.form>
          )}

          {patientStep === 'picker' && (
            <motion.div
              key="picker"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Who&apos;s signing in?</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--subtle-foreground)' }}>
                  {profiles.length} patients are registered on {phone}.
                </p>
              </div>
              <PatientProfilePicker
                profiles={profiles}
                onSelect={(p) => {
                  setSelectedProfile(p);
                  setPatientStep('password');
                }}
              />
              <button
                type="button"
                onClick={backToPhone}
                className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Use a different number
              </button>
            </motion.div>
          )}

          {patientStep === 'password' && selectedProfile && (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePatientPasswordSubmit}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 p-3 rounded-xl surface">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-accent)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {selectedProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{selectedProfile.name}</p>
                  <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{phone}</p>
                </div>
              </div>

              <FormField
                label="Password"
                required
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                value={patientPassword}
                onChange={(e) => setPatientPassword(e.target.value)}
                placeholder="••••••••"
                endAdornment={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--subtle-foreground)] hover:text-[var(--foreground)] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button type="submit" variant="primary" fullWidth loading={loading} icon={<LogIn className="w-4 h-4" />} glow>
                Sign In as {selectedProfile.name.split(' ')[0]}
              </Button>

              <button
                type="button"
                onClick={backToPhone}
                className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Not {selectedProfile.name.split(' ')[0]}? Go back
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      )}

      <div className="mt-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {role === 'doctor' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[var(--brand-secondary)] font-medium hover:underline">Sign up now</Link>
          </>
        ) : (
          <>
            Don&apos;t have patient access?{' '}
            <Link href="/patient/register" className="text-[var(--brand-secondary)] font-medium hover:underline">Register as Patient</Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
