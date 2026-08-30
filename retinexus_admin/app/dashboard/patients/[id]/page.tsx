'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Cake, User as UserIcon, MapPin, Droplet, Stethoscope, FileText, AlertTriangle, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/Common/Button';
import { Swirling } from '@/components/ui/Swirling';
import EditPatientModal from '@/components/Dashboard/EditPatientModal';
import type { Patient, DoctorOption } from '../types';

interface ReportSummary {
  id: string;
  reportNumber: number;
  drGrade: string;
  confidence: number;
  description: string;
  imageUrl: string;
  processedAt: string;
  createdAt: string;
}

interface DetailedAnalysisSummary {
  id: string;
  testName: string;
  clinicalSummary: string;
  urgency: string;
  redFlags: string[];
  recommendations: string[];
  createdAt: string;
}

interface PatientDetail extends Patient {
  reports: ReportSummary[];
  detailedAnalyses: DetailedAnalysisSummary[];
}

const GRADE_COLOR: Record<string, string> = {
  'No DR': 'var(--brand-success)',
  'Mild NPDR': 'var(--brand-warning)',
  'Moderate NPDR': '#f97316',
  'Severe NPDR': 'var(--brand-danger)',
  PDR: '#dc2626',
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [patientRes, doctorsRes] = await Promise.all([
        fetch(`/api/patients/${params.id}`),
        fetch('/api/patients'),
      ]);
      if (!patientRes.ok) throw new Error('Patient not found');
      setPatient(await patientRes.json());
      const doctorsData = await doctorsRes.json();
      setDoctors(doctorsData.doctors || []);
    } catch {
      toast.error('Could not load this patient');
      router.push('/dashboard/patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading || !patient) {
    return (
      <div className="surface rounded-2xl p-16 text-center">
        <Swirling className="w-8 h-8 mx-auto" style={{ color: 'var(--brand-secondary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title={patient.name}
        description={patient.doctor ? `Under ${patient.doctor.name}` : 'Self-registered — no assigned doctor'}
        actions={
          <>
            <Link href={patient.doctorId ? `/dashboard/doctors/${patient.doctorId}` : '/dashboard/patients'}>
              <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
            </Link>
            <Button variant="secondary" icon={<Pencil className="w-4 h-4" />} onClick={() => setEditing(true)}>Edit</Button>
          </>
        }
      />

      <div className="surface rounded-2xl p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
          <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {patient.phone}
        </div>
        <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
          <Cake className="w-3.5 h-3.5 flex-shrink-0" /> {patient.age ?? '—'} yrs
        </div>
        <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
          <UserIcon className="w-3.5 h-3.5 flex-shrink-0" /> {patient.gender || '—'}
        </div>
        <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
          <Droplet className="w-3.5 h-3.5 flex-shrink-0" /> {patient.diabetesLevel || '—'}
        </div>
        <div className="text-sm flex items-center gap-2 sm:col-span-2 lg:col-span-4" style={{ color: 'var(--muted-foreground)' }}>
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {patient.address || '—'}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <FileText className="w-4 h-4" /> Screening Reports ({patient.reports.length})
        </h3>
        {patient.reports.length === 0 ? (
          <EmptyState icon={FileText} title="No screening reports" description="No retinal screening has been recorded for this patient." />
        ) : (
          <div className="surface rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {['#', 'DR Grade', 'Confidence', 'Description', 'Date'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patient.reports.map((r) => (
                    <tr key={r.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-5 py-3.5" style={{ color: 'var(--muted-foreground)' }}>#{r.reportNumber}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'var(--muted)', color: GRADE_COLOR[r.drGrade] || 'var(--foreground)' }}>
                          {r.drGrade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--muted-foreground)' }}>{(r.confidence * 100).toFixed(0)}%</td>
                      <td className="px-5 py-3.5 max-w-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{r.description}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--subtle-foreground)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Stethoscope className="w-4 h-4" /> Detailed Analyses ({patient.detailedAnalyses.length})
        </h3>
        {patient.detailedAnalyses.length === 0 ? (
          <EmptyState icon={Stethoscope} title="No detailed analyses" description="No follow-up test analysis has been recorded for this patient." />
        ) : (
          <div className="space-y-3">
            {patient.detailedAnalyses.map((d) => (
              <div key={d.id} className="surface rounded-2xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{d.testName}</p>
                  <div className="flex items-center gap-2">
                    {d.redFlags.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-500">
                        <AlertTriangle className="w-3 h-3" /> {d.redFlags.length} red flag{d.redFlags.length === 1 ? '' : 's'}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>{d.clinicalSummary}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditPatientModal
          patient={patient}
          doctors={doctors}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setPatient((prev) => (prev ? { ...prev, ...updated } : prev))}
        />
      )}
    </div>
  );
}
