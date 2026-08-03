'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Edit2, Stethoscope, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function PatientProfilePage() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        setPatientData(data);

        if (data.doctorId) {
          try {
            let doctorResponse = await fetch(`/api/users/${data.doctorId}`, { credentials: 'include' });

            if (!doctorResponse.ok) {
              const allDoctorsResponse = await fetch('/api/users?role=DOCTOR', { credentials: 'include' });
              if (allDoctorsResponse.ok) {
                const allDoctors = await allDoctorsResponse.json();
                const foundDoctor = allDoctors.find((d: any) => {
                  const patientDocId = data.doctorId;
                  const doctorId = d.id;
                  if (patientDocId.includes(doctorId) || doctorId.includes(patientDocId)) return true;
                  if (data.doctorName && d.name.toLowerCase().includes(data.doctorName.toLowerCase())) return true;
                  return false;
                });
                if (foundDoctor) setDoctorInfo(foundDoctor);
                else if (allDoctors.length > 0) setDoctorInfo(allDoctors[0]);
              }
            } else {
              const doctorData = await doctorResponse.json();
              setDoctorInfo(doctorData);
            }
          } catch (error) {
            console.error('Error fetching doctor info:', error);
          }
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl animate-shimmer" />
        <SkeletonCard />
      </div>
    );
  }

  const isSelfRegistered = !patientData?.doctorId || patientData?.doctorId === '';
  const doctorName = doctorInfo?.name || patientData?.doctorName || null;
  const doctorHospital = doctorInfo?.hospital || null;
  const doctorSpecialization = doctorInfo?.specialization || null;

  const details = [
    { label: 'Full Name', value: patientData?.name },
    { label: 'CNIC', value: patientData?.cnic },
    { label: 'Phone Number', value: patientData?.phone },
    { label: 'Age', value: patientData?.age },
    { label: 'Gender', value: patientData?.gender },
    { label: 'Registered Date', value: patientData?.createdAt ? format(new Date(patientData.createdAt), 'MMM d, yyyy') : null },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="View your personal information" />

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="surface rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {patientData?.name?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{patientData?.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm" style={{ color: 'var(--subtle-foreground)' }}>Patient</p>
              <Badge tone={isSelfRegistered ? 'warning' : 'success'}>{isSelfRegistered ? 'Self Registered' : 'Registered'}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> CNIC: {patientData?.cnic}</span>
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {patientData?.phone}</span>
              {patientData?.gender && <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {patientData?.gender}</span>}
            </div>
          </div>
          <button
            onClick={() => router.push('/patient/settings')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-secondary)]/10 border border-[var(--brand-secondary)]/25 text-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)]/20 transition-all duration-300"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </motion.div>

      {/* Patient Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {details.map((d) => (
          <div key={d.label} className="surface rounded-2xl p-6">
            <p className="text-xs mb-1" style={{ color: 'var(--subtle-foreground)' }}>{d.label}</p>
            <p className="font-medium" style={{ color: 'var(--foreground)' }}>{d.value || 'N/A'}</p>
          </div>
        ))}

        {patientData?.address && (
          <div className="surface rounded-2xl p-6 md:col-span-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--subtle-foreground)' }} />
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--subtle-foreground)' }}>Address</p>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{patientData?.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Info */}
        <div className="surface rounded-2xl p-6 md:col-span-2">
          <div className="flex items-start gap-2">
            <Stethoscope className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--subtle-foreground)' }} />
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--subtle-foreground)' }}>Registered Doctor</p>
              {patientData?.doctorId ? (
                doctorName ? (
                  <>
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>Dr. {doctorName}</p>
                    {doctorHospital && <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>Hospital: {doctorHospital}</p>}
                    {doctorSpecialization && <p className="text-xs mt-0.5" style={{ color: 'var(--subtle-foreground)' }}>Specialization: {doctorSpecialization}</p>}
                  </>
                ) : (
                  <>
                    <p className="text-amber-500 font-medium">Doctor information not available</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>Please contact your doctor or hospital to update your profile.</p>
                  </>
                )
              ) : (
                <p className="text-amber-500 font-medium">Self Registered (No Doctor Assigned)</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
