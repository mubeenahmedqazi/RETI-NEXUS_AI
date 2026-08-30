'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Stethoscope, CheckCircle2, ShieldOff, ShieldCheck, Pencil, Users, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/Common/Button';
import { Swirling } from '@/components/ui/Swirling';
import EditDoctorModal from '@/components/Dashboard/EditDoctorModal';
import ConfirmDeleteModal from '@/components/Dashboard/ConfirmDeleteModal';
import type { Doctor } from './types';

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'BLOCKED';

const STATUS_STYLES: Record<Doctor['status'], { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'rgba(245,158,11,0.12)', text: 'var(--brand-warning)', label: 'Pending' },
  APPROVED: { bg: 'rgba(16,185,129,0.12)', text: 'var(--brand-success)', label: 'Approved' },
  BLOCKED: { bg: 'rgba(239,68,68,0.12)', text: 'var(--brand-danger)', label: 'Blocked' },
};

function StatusBadge({ status }: { status: Doctor['status'] }) {
  const s = STATUS_STYLES[status];
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState<Doctor | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('status');
    if (initial && ['PENDING', 'APPROVED', 'BLOCKED'].includes(initial)) {
      setFilter(initial as Filter);
    }
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/doctors');
      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const filtered = filter === 'ALL' ? doctors : doctors.filter((d) => d.status === filter);

  const setStatus = async (doctor: Doctor, status: Doctor['status']) => {
    setActioningId(doctor.id);
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Update failed');
      setDoctors((prev) => prev.map((d) => (d.id === doctor.id ? { ...d, status } : d)));
      toast.success(
        status === 'APPROVED' ? `${doctor.name} approved` : status === 'BLOCKED' ? `${doctor.name} blocked` : `${doctor.name} unblocked`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    const response = await fetch(`/api/doctors/${doctor.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || 'Failed to delete doctor');
      return;
    }
    setDoctors((prev) => prev.filter((d) => d.id !== doctor.id));
    toast.success(`${doctor.name} deleted`);
    if (data.warning) toast.warn(data.warning, { autoClose: 10000 });
    setDeleting(null);
  };

  const counts = {
    ALL: doctors.length,
    PENDING: doctors.filter((d) => d.status === 'PENDING').length,
    APPROVED: doctors.filter((d) => d.status === 'APPROVED').length,
    BLOCKED: doctors.filter((d) => d.status === 'BLOCKED').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin Console" title="Doctors" description="Approve new signups, manage credentials, and control access" />

      <div className="flex gap-1.5 p-1 rounded-xl bg-[var(--muted)] w-fit">
        {(['ALL', 'PENDING', 'APPROVED', 'BLOCKED'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f ? 'bg-[var(--card)] shadow text-[var(--brand-secondary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {f === 'ALL' ? 'All' : STATUS_STYLES[f].label} <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="surface rounded-2xl p-16 text-center">
          <Swirling className="w-8 h-8 mx-auto" style={{ color: 'var(--brand-secondary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors here" description="No doctor accounts match this filter yet." />
      ) : (
        <div className="surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Doctor', 'Hospital', 'Patients', 'Status', 'Joined', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doctor, i) => (
                  <motion.tr
                    key={doctor.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b last:border-0 hover:bg-[var(--muted)]/50 transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/doctors/${doctor.id}`} className="hover:underline">
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>{doctor.name}</p>
                        <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{doctor.email}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{doctor.hospital || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                        <Users className="w-3.5 h-3.5" /> {doctor._count?.patients ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={doctor.status} /></td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--subtle-foreground)' }}>
                      {new Date(doctor.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        {doctor.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="success"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            loading={actioningId === doctor.id}
                            onClick={() => setStatus(doctor, 'APPROVED')}
                          >
                            Approve
                          </Button>
                        )}
                        {doctor.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<ShieldOff className="w-3.5 h-3.5" />}
                            loading={actioningId === doctor.id}
                            onClick={() => setStatus(doctor, 'BLOCKED')}
                          >
                            Block
                          </Button>
                        )}
                        {doctor.status === 'BLOCKED' && (
                          <Button
                            size="sm"
                            variant="success"
                            icon={<ShieldCheck className="w-3.5 h-3.5" />}
                            loading={actioningId === doctor.id}
                            onClick={() => setStatus(doctor, 'APPROVED')}
                          >
                            Unblock
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditing(doctor)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeleting(doctor)}>
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
        <EditDoctorModal
          doctor={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title={`Delete ${deleting.name}?`}
          description={`This permanently removes ${deleting.name}'s account. Doctors with existing patients or clinical records can't be deleted — reassign or clear those first.`}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </div>
  );
}
