'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Phone, Lock, UserPlus, MapPin } from 'lucide-react';
import AuthShell from '@/components/Common/AuthShell';
import { FormField, SelectField } from '@/components/ui/FormField';
import Button from '@/components/Common/Button';
import Loader from '@/components/ui/Loader';
import { isValidPhone } from '@/lib/utils';

export default function PatientRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '', phone: '', password: '', confirmPassword: '', age: '', gender: '', address: '',
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
    if (!isValidPhone(formData.phone)) {
      setError('Phone number must be exactly 11 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/patient-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          password: formData.password,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender,
          address: formData.address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--brand-accent)]/15 border-2 border-[var(--brand-accent)]/40 flex items-center justify-center mb-6">
            <UserPlus className="w-10 h-10 text-[var(--brand-accent)]" />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Registration Successful!</h2>
          <p className="mt-2 mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Your patient account has been created successfully.<br />You can now login with your phone number and password.
          </p>
          <Loader size="md" />
        </motion.div>
      </div>
    );
  }

  return (
    <AuthShell eyebrow="Patient access" title="Create your patient account" subtitle="Register to securely view your retinal screening reports">
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg p-3 text-sm mb-5">
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name" required icon={User} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
        <FormField
          label="Phone Number"
          required
          type="tel"
          inputMode="numeric"
          maxLength={11}
          icon={Phone}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
          placeholder="11-digit phone number"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="30" />
          <SelectField label="Gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </SelectField>
        </div>

        <FormField label="Address" icon={MapPin} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St, City" />

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
          Register as Patient
        </Button>
      </form>

      <div className="mt-5 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--brand-secondary)] font-medium hover:underline">Sign in</Link>
      </div>
    </AuthShell>
  );
}
