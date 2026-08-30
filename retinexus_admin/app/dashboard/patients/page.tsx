'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Users, Pencil, UserX, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/Common/Button';
import { Swirling } from '@/components/ui/Swirling';
import EditPatientModal from '@/components/Dashboard/EditPatientModal';
import ConfirmDeleteModal from '@/components/Dashboard/ConfirmDeleteModal';
import type { Patient, DoctorOption } from './types';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      setPatients(data.patients || []);
      setDoctors(data.doctors || []);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (patient: Patient) => {
    const response = await fetch(`/api/patients/${patient.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || 'Failed to delete patient');
      return;
    }
    setPatients((prev) => prev.filter((p) => p.id !== patient.id));
    toast.success(`${patient.name} deleted`);
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title="Patients"
        description="Every patient across the platform — edit details or reassign a doctor. Patient accounts can't be blocked here."
      />

      {loading ? (
        <div className="surface rounded-2xl p-16 text-center">
          <Swirling className="w-8 h-8 mx-auto" style={{ color: 'var(--brand-secondary)' }} />
        </div>
      ) : patients.length === 0 ? (
        <EmptyState icon={Users} title="No patients yet" description="No patients have been registered on the platform." />
      ) : (
        <div className="surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Patient', 'Phone', 'Age / Gender', 'Doctor', 'Registered', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b last:border-0 hover:bg-[var(--muted)]/50 transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--foreground)' }}>{p.name}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{p.phone}</td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--muted-foreground)' }}>
                      {p.age ?? '—'}{p.gender ? ` • ${p.gender}` : ''}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.doctor ? (
                        <span style={{ color: 'var(--muted-foreground)' }}>{p.doctor.name}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'var(--muted)', color: 'var(--subtle-foreground)' }}>
                          <UserX className="w-3 h-3" /> Self-registered
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--subtle-foreground)' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditing(p)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeleting(p)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <EditPatientModal
          patient={editing}
          doctors={doctors}
          onClose={() => setEditing(null)}
          onSaved={(updated) => setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title={`Delete ${deleting.name}?`}
          description={`This permanently removes ${deleting.name}'s profile. Patients with existing screening or detailed-analysis records can't be deleted.`}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </div>
  );
}
