'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, UserPlus, Key, ShieldCheck, ScanLine, HeartPulse } from 'lucide-react';
import Button from '@/components/Common/Button';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { FormField, SelectField } from '@/components/ui/FormField';
import { isValidPhone } from '@/lib/utils';

const onboardingSteps = [
  { icon: Key, title: 'Instant login created', desc: "The patient's password defaults to their name (lowercase, no spaces) — share it with them after saving." },
  { icon: ScanLine, title: 'Ready for screening right away', desc: "Once saved, you're taken straight back to Patients — a screening scan is one click away." },
  { icon: HeartPulse, title: 'Full record from day one', desc: 'Every report, detailed analysis, and trend for this patient lives under their profile going forward.' },
];

export default function AddPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', age: '', gender: '', address: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) });
  };

  const defaultPassword = formData.name.toLowerCase().replace(/\s/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      toast.error('Phone number must be exactly 11 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Invalid server response');
      }

      if (response.ok && result.success) {
        const password = result.defaultPassword || defaultPassword;
        toast.success(`Patient added successfully! Default password: ${password} — please share this with the patient.`, { autoClose: 8000 });
        router.push('/dashboard/patients');
      } else {
        toast.error(result.error || 'Failed to add patient');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient Records"
        title="Add New Patient"
        description="Register a new patient to start screening and tracking their retinal health."
        actions={
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.push('/dashboard/patients')}>
            Back to Patients
          </Button>
        }
      />

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Onboarding panel */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-2">
          <GlassCard padding="lg" className="h-full">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
              <UserPlus className="w-6 h-6 text-[var(--brand-secondary)]" />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--foreground)' }}>What happens next</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              A few essentials, then the patient is fully set up.
            </p>
            <div className="space-y-5">
              {onboardingSteps.map((step) => (
                <div key={step.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--brand-secondary)]/10">
                    <step.icon className="w-4 h-4 text-[var(--brand-secondary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{step.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--subtle-foreground)' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="lg:col-span-3">
          <GlassCard padding="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              {formData.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3.5 rounded-xl bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 flex items-start gap-2.5"
                >
                  <Key className="w-4 h-4 text-[var(--brand-accent)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--brand-accent)]">
                      Default password: <span className="font-bold">{defaultPassword}</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--subtle-foreground)' }}>The patient logs in with this — share it with them after saving.</p>
                  </div>
                </motion.div>
              )}

              <FormField label="Full Name" required name="name" value={formData.name} onChange={handleChange} placeholder="Enter patient's full name" />
              <FormField
                label="Phone Number"
                required
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="11-digit phone number"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Age" type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" />
                <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </SelectField>
              </div>

              <FormField label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Enter address" />

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/patients')} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading} className="flex-1" glow icon={<ShieldCheck className="w-4 h-4" />}>
                  Add Patient
                </Button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
