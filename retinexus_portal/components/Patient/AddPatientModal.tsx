'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Key } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '@/components/Common/Button';
import { FormField, SelectField } from '@/components/ui/FormField';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
}

export default function AddPatientModal({ isOpen, onClose, onAdd }: AddPatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ cnic: '', name: '', phone: '', age: '', gender: '', address: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getDefaultPassword = (name: string) => name.toLowerCase().replace(/\s/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cnic || !formData.name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setLoading(true);
      await onAdd(formData);
      setFormData({ cnic: '', name: '', phone: '', age: '', gender: '', address: '' });
    } catch (error) {
      console.error('Error adding patient:', error);
    } finally {
      setLoading(false);
    }
  };

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
                  Add New Patient
                </h2>
                <button onClick={onClose} className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors duration-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {formData.name && (
                <div className="p-3 rounded-xl bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[var(--brand-accent)]" />
                    <p className="text-xs text-[var(--brand-accent)]">
                      Default Password: <span className="font-bold">{getDefaultPassword(formData.name)}</span>
                    </p>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>Patient can login with this password</p>
                </div>
              )}

              <FormField label="CNIC Number" required name="cnic" value={formData.cnic} onChange={handleChange} placeholder="e.g., 12345-1234567-1" />
              <FormField label="Full Name" required name="name" value={formData.name} onChange={handleChange} placeholder="Enter patient's full name" />
              <FormField label="Phone Number" required name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />

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
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" variant="primary" loading={loading} className="flex-1" glow>Add Patient</Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
