'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft, Search, SearchCheck, Scan, User, Phone, Calendar,
  CheckCircle, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { getPatients } from '@/services/api';
import Button from '@/components/Common/Button';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import Loader from '@/components/ui/Loader';
import Badge, { gradeToTone } from '@/components/ui/Badge';

interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  createdAt: string;
  reports: any[];
  doctorId: string;
  doctor?: { name: string };
}

export default function PatientAnalysisPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Patient[]>([]);
  const [status, setStatus] = useState<'idle' | 'own' | 'other' | 'none'>('idle');
  const [currentDoctorId, setCurrentDoctorId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.id && setCurrentDoctorId(data.id))
      .catch(() => {});
  }, []);

  const handleSearch = async () => {
    const rawTerm = searchTerm.trim();
    if (!rawTerm) return;

    setIsSearching(true);
    try {
      // Searches this doctor's own patients plus, for a phone-shaped query, patients
      // self-registered or seen by another doctor first — a scan is only actionable once
      // the doctor knows which of those two cases they're looking at.
      const looksLikePhone = /^\d{4,}$/.test(rawTerm);
      const data: Patient[] = await getPatients(looksLikePhone ? rawTerm : undefined);
      const term = rawTerm.toLowerCase();
      const matches = looksLikePhone
        ? data
        : data.filter((p) => p.name?.toLowerCase().includes(term) || p.phone?.includes(term));

      if (matches.length > 0) {
        const allOwn = matches.every((p) => p.doctorId === currentDoctorId);
        setStatus(allOwn ? 'own' : 'other');
        setResults(matches);
      } else {
        setStatus('none');
        setResults([]);
      }
    } catch (error) {
      console.error('Patient search failed:', error);
      setStatus('none');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const latestGrade = (patient: Patient) => patient.reports?.[0]?.drGrade as string | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient Records"
        title="Patient Analysis"
        description="Find a patient by name or phone, then jump straight into a new screening."
        actions={
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.push('/dashboard/patients')}>
            Back to Patients
          </Button>
        }
      />

      <GlassCard padding="lg">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />
            <input
              autoFocus
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-transparent border rounded-xl pl-10 pr-4 py-3 ring-focus outline-none transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>
          <Button variant="primary" onClick={handleSearch} disabled={isSearching || !searchTerm.trim()} icon={isSearching ? <Loader size="sm" /> : <SearchCheck className="w-4 h-4" />} glow>
            {isSearching ? 'Searching...' : 'Find Patient'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {status === 'other' && (
            <motion.div
              key="other"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3.5 rounded-xl text-sm flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Found matching patient(s) registered with another doctor or self-registered — review carefully before screening.
            </motion.div>
          )}
          {status === 'none' && (
            <motion.div
              key="none"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3.5 rounded-xl text-sm bg-red-500/10 border border-red-500/25 text-red-500"
            >
              No patient found matching &ldquo;{searchTerm}&rdquo;.
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      <AnimatePresence>
        {results.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <GlassCard hover padding="lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl flex-shrink-0 bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
                      <User className="w-5 h-5 text-[var(--brand-secondary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{patient.name}</h4>
                        {latestGrade(patient) && <Badge tone={gradeToTone(latestGrade(patient))}>{latestGrade(patient)}</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm" style={{ color: 'var(--subtle-foreground)' }}>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Since {format(new Date(patient.createdAt), 'MMM yyyy')}</span>
                      </div>
                      {patient.doctorId !== currentDoctorId && (
                        <p className="text-xs mt-2 text-amber-500">
                          {patient.doctor?.name ? `Registered with Dr. ${patient.doctor.name}` : 'Self-registered — no doctor assigned yet'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <Button
                      variant="primary"
                      className="flex-1"
                      glow
                      icon={<Scan className="w-4 h-4" />}
                      onClick={() => router.push(`/dashboard/upload?patientId=${encodeURIComponent(patient.id)}&patientName=${encodeURIComponent(patient.name)}`)}
                    >
                      Start Screening
                    </Button>
                    <Button
                      variant="outline"
                      icon={<ExternalLink className="w-4 h-4" />}
                      onClick={() => router.push(`/dashboard/patient/${encodeURIComponent(patient.id)}`)}
                    >
                      Profile
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {status === 'idle' && (
        <div className="text-center py-16">
          <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--subtle-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Search for a patient above to get started.</p>
        </div>
      )}
    </div>
  );
}
