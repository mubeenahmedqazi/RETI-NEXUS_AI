'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Hospital, Phone, Stethoscope, Users, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/Common/Button';
import { Swirling } from '@/components/ui/Swirling';
import EditDoctorModal from '@/components/Dashboard/EditDoctorModal';
import ConfirmDeleteModal from '@/components/Dashboard/ConfirmDeleteModal';
import type { Doctor } from '../types';

interface DoctorDetail extends Doctor {
  patients: { id: string; name: string; phone: string; age: number | null; gender: string | null; createdAt: string }[];
}

const STATUS_LABEL: Record<Doctor['status'], string> = { PENDING: 'Pending', APPROVED: 'Approved', BLOCKED: 'Blocked' };

export default function DoctorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/doctors/${params.id}`);
      if (!response.ok) throw new Error('Doctor not found');
      setDoctor(await response.json());
    } catch {
      toast.error('Could not load this doctor');
      router.push('/dashboard/doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading || !doctor) {
    return (
      <div className="surface rounded-2xl p-16 text-center">
        <Swirling className="w-8 h-8 mx-auto" style={{ color: 'var(--brand-secondary)' }} />
      </div>
    );
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/doctors/${doctor.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || 'Failed to delete doctor');
      return;
    }
    toast.success(`${doctor.name} deleted`);
    if (data.warning) toast.warn(data.warning, { autoClose: 10000 });
    router.push('/dashboard/doctors');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title={doctor.name}
        description={`Status: ${STATUS_LABEL[doctor.status]}`}
        actions={
          <>
            <Link href="/dashboard/doctors">
              <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
            </Link>
            <Button variant="secondary" icon={<Pencil className="w-4 h-4" />} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleting(true)}>Delete</Button>
          </>
        }
      />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="surface rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Profile</h3>
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {doctor.email}
          </div>
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <Hospital className="w-3.5 h-3.5 flex-shrink-0" /> {doctor.hospital || '—'}
          </div>
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {doctor.phone || '—'}
          </div>
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" /> {doctor.specialization || '—'}
          </div>
        </div>

        <div className="surface rounded-2xl p-5 md:col-span-2 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15 flex items-center justify-center">
            <Users className="w-6 h-6 text-[var(--brand-secondary)]" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{doctor.patients.length}</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Registered patients</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Patients</h3>
        {doctor.patients.length === 0 ? (
          <EmptyState icon={Users} title="No patients yet" description="This doctor has not registered any patients." />
        ) : (
          <div className="surface rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {['Name', 'Phone', 'Age', 'Gender', 'Registered'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doctor.patients.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => router.push(`/dashboard/patients/${p.id}`)}
                    >
                      <td className="px-5 py-3.5 font-medium hover:underline" style={{ color: 'var(--foreground)' }}>{p.name}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{p.phone}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{p.age ?? '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{p.gender || '—'}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--subtle-foreground)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditDoctorModal
          doctor={doctor}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setDoctor((prev) => (prev ? { ...prev, ...updated } : prev))}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title={`Delete ${doctor.name}?`}
          description="This permanently removes the doctor's account. Doctors with existing patients or clinical records can't be deleted — reassign or clear those first."
          onClose={() => setDeleting(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
