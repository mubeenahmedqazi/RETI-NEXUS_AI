'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn, User, Stethoscope, UserCircle } from 'lucide-react';
import AuthShell from '@/components/Common/AuthShell';
import { FormField } from '@/components/ui/FormField';
import Button from '@/components/Common/Button';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [role, setRole] = useState<'doctor' | 'patient'>('doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('userName', data.name);
        sessionStorage.setItem('userRole', data.role);
        if (data.role === 'DOCTOR') {
          router.push('/dashboard');
        } else if (data.role === 'PATIENT') {
          sessionStorage.setItem('patientCnic', data.cnic);
          router.push('/patient/dashboard');
        }
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
              onClick={() => setRole(r)}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label={role === 'doctor' ? 'Email Address' : 'CNIC or Phone Number'}
          required
          icon={role === 'doctor' ? Mail : User}
          type={role === 'doctor' ? 'email' : 'text'}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder={role === 'doctor' ? 'doctor@hospital.com' : '12345-1234567-1 or 0300-1234567'}
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
          Sign In as {role === 'doctor' ? 'Doctor' : 'Patient'}
        </Button>
      </form>

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
