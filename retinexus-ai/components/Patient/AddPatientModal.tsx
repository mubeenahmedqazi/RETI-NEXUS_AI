'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Calendar, MapPin, Users, Activity, Key } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '@/components/Common/Button';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => Promise<void>; // ✅ Changed from onSuccess to onAdd
}

export default function AddPatientModal({ isOpen, onClose, onAdd }: AddPatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cnic: '',
    name: '',
    phone: '',
    age: '',
    gender: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Generate default password preview
  const getDefaultPassword = (name: string) => {
    return name.toLowerCase().replace(/\s/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cnic || !formData.name || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      // ✅ Call onAdd from parent instead of making API call here
      await onAdd(formData);
      // ✅ Reset form on success (parent will handle closing)
      setFormData({ cnic: '', name: '', phone: '', age: '', gender: '', address: '' });
    } catch (error) {
      // Error is handled in parent
      console.error('Error adding patient:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-lg bg-[#0a0a1a] rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/10 overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/5 to-indigo-500/5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Add New Patient
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-white transition-colors duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* ✅ Default Password Preview */}
              {formData.name && (
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <p className="text-xs text-cyan-400">
                      Default Password: <span className="font-bold">{getDefaultPassword(formData.name)}</span>
                    </p>
                  </div>
                  <p className="text-xs text-white/30 mt-1">
                    Patient can login with this password
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-white/40 block mb-1">CNIC Number *</label>
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  placeholder="Enter 13-digit CNIC (e.g., 12345-1234567-1)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>

              <div>
                <label className="text-sm text-white/40 block mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter patient's full name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>

              <div>
                <label className="text-sm text-white/40 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/40 block mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Age"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/40 block mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/40 block mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                  glow
                >
                  Add Patient
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}