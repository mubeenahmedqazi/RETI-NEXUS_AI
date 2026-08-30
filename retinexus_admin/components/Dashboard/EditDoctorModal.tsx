'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { FormField } from '@/components/ui/FormField';
import Button from '@/components/Common/Button';
import type { Doctor } from '@/app/dashboard/doctors/types';

export default function EditDoctorModal({
  doctor,
  onClose,
  onSaved,
}: {
  doctor: Doctor;
  onClose: () => void;
  onSaved: (updated: Doctor) => void;
}) {
  const [form, setForm] = useState({
    name: doctor.name,
    email: doctor.email,
    hospital: doctor.hospital || '',
    phone: doctor.phone || '',
    specialization: doctor.specialization || '',
    newPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          hospital: form.hospital,
          phone: form.phone,
          specialization: form.specialization,
          ...(form.newPassword ? { newPassword: form.newPassword } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save changes');
      toast.success('Doctor details updated');
      onSaved({ ...doctor, ...data });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="surface rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Edit Doctor</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
              <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>

          <div className="space-y-4">
            <FormField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <FormField label="Hospital" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} />
            <FormField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <FormField label="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            <FormField
              label="Reset Password (optional)"
              icon={KeyRound}
              type="text"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Leave blank to keep unchanged"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" icon={<Save className="w-4 h-4" />} loading={saving} onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
