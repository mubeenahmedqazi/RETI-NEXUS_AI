'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { FormField, SelectField } from '@/components/ui/FormField';
import Button from '@/components/Common/Button';
import type { Patient, DoctorOption } from '@/app/dashboard/patients/types';

export default function EditPatientModal({
  patient,
  doctors,
  onClose,
  onSaved,
}: {
  patient: Patient;
  doctors: DoctorOption[];
  onClose: () => void;
  onSaved: (updated: Patient) => void;
}) {
  const [form, setForm] = useState({
    name: patient.name,
    phone: patient.phone,
    age: patient.age?.toString() || '',
    gender: patient.gender || '',
    address: patient.address || '',
    doctorId: patient.doctorId || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          age: form.age ? parseInt(form.age, 10) : null,
          gender: form.gender || null,
          address: form.address || null,
          doctorId: form.doctorId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save changes');
      toast.success('Patient details updated');
      onSaved(data);
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
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Edit Patient</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
              <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>

          <div className="space-y-4">
            <FormField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              <FormField label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
            </div>
            <FormField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <SelectField label="Assigned Doctor" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Self-registered (no doctor)</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </SelectField>
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
