'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Users, SearchCheck, X, HeartPulse, ShieldAlert } from 'lucide-react';
import { getPatients } from '@/services/api';
import PatientCard from '@/components/Patient/PatientCard';
import Button from '@/components/Common/Button';
import GlassCard from '@/components/ui/GlassCard';
import { SectionLoader } from '@/components/ui/Loader';
import PageHeader from '@/components/ui/PageHeader';

interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  email?: string;
  diabetesLevel?: string;
  createdAt: string;
  reports: any[];
  doctorId: string;
  _count?: { reports: number };
}

function needsAttention(patient: Patient) {
  const latest = patient.reports?.[0];
  return latest && !['No DR'].includes(latest.drGrade);
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const term = searchTerm.trim().toLowerCase();
  const filteredPatients = term
    ? patients.filter((p) => p.name?.toLowerCase().includes(term) || p.phone?.includes(term))
    : patients;

  const attentionCount = patients.filter(needsAttention).length;

  if (loading) {
    return <SectionLoader label="Loading patients..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Patients"
        description="Browse and manage the patients registered under your care."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<SearchCheck className="w-4 h-4" />} onClick={() => router.push('/dashboard/patients/analysis')}>
              Patient Analysis
            </Button>
            <Button variant="primary" size="sm" glow icon={<UserPlus className="w-4 h-4" />} onClick={() => router.push('/dashboard/patients/add')}>
              Add Patient
            </Button>
          </div>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        <GlassCard padding="md" className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
            <Users className="w-5 h-5 text-[var(--brand-secondary)]" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{patients.length}</p>
            <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Total Patients</p>
          </div>
        </GlassCard>
        <GlassCard padding="md" className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/10">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{attentionCount}</p>
            <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Need Follow-up</p>
          </div>
        </GlassCard>
      </div>

      {/* Filter */}
      <div className="surface rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />
          <input
            type="text"
            placeholder="Filter by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border rounded-xl pl-10 pr-10 py-2.5 ring-focus outline-none transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--subtle-foreground)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredPatients.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full surface rounded-2xl p-12 text-center">
              {searchTerm ? (
                <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--subtle-foreground)' }} />
              ) : (
                <HeartPulse className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--subtle-foreground)' }} />
              )}
              <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
                {searchTerm ? 'No patients found matching your search' : 'No patients yet'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--subtle-foreground)' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first patient to get started'}
              </p>
              {!searchTerm && (
                <Button variant="primary" glow className="mt-4" icon={<UserPlus className="w-4 h-4" />} onClick={() => router.push('/dashboard/patients/add')}>
                  Add Patient
                </Button>
              )}
              {searchTerm && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </motion.div>
          ) : (
            filteredPatients.map((patient, index) => (
              <PatientCard key={patient.id} patient={patient} index={index} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
