'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Hospital, Phone, UserPlus, Stethoscope } from 'lucide-react';
import AuthShell from '@/components/Common/AuthShell';
import { FormField } from '@/components/ui/FormField';
import Button from '@/components/Common/Button';
import Loader from '@/components/ui/Loader';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    hospital: '',
    phone: '',
    specialization: 'Ophthalmology',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          hospital: formData.hospital,
          phone: formData.phone,
          specialization: formData.specialization,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mb-6">
            <UserPlus className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Account Created!</h2>
          <p className="mt-2 mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Your doctor account has been successfully created.<br />Redirecting to login...
          </p>
          <Loader size="md" />
        </motion.div>
      </div>
    );
  }

  return (
    <AuthShell eyebrow="Join Retinexus AI" title="Create your doctor account" subtitle="Set up your clinical screening workspace in minutes">
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg p-3 text-sm mb-5">
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name" required icon={User} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Dr. John Doe" />
        <FormField label="Email Address" required type="email" icon={Mail} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="doctor@hospital.com" />
        <FormField label="Hospital" required icon={Hospital} value={formData.hospital} onChange={(e) => setFormData({ ...formData, hospital: e.target.value })} placeholder="City Hospital" />
        <FormField label="Phone Number" required type="tel" icon={Phone} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 8900" />

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Specialization</label>
          <div className="relative">
            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-accent)]" />
            <input
              type="text"
              value={formData.specialization}
              readOnly
              disabled
              className="w-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/25 rounded-lg pl-10 pr-24 py-2.5 font-medium cursor-not-allowed outline-none text-[var(--brand-accent)]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-[var(--brand-accent)]/15 text-[var(--brand-accent)] px-2 py-0.5 rounded-full">Fixed</span>
          </div>
        </div>

        <FormField
          label="Password" required icon={Lock} type={showPassword ? 'text' : 'password'}
          value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Min 6 characters"
          endAdornment={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--subtle-foreground)] hover:text-[var(--foreground)]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
        />
        <FormField
          label="Confirm Password" required icon={Lock} type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="Confirm your password"
          endAdornment={<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-[var(--subtle-foreground)] hover:text-[var(--foreground)]">{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
        />

        <Button type="submit" variant="primary" fullWidth loading={loading} icon={<UserPlus className="w-4 h-4" />} glow className="mt-2">
          Create Account
        </Button>
      </form>

      <div className="mt-5 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--brand-secondary)] font-medium hover:underline">Sign in</Link>
      </div>
    </AuthShell>
  );
}
