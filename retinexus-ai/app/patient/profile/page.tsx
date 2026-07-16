'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Calendar, ArrowLeft, Edit2, Stethoscope, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

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
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Patient data:', data);
        setPatientData(data);

        // If patient has a doctorId, try to find the doctor
        if (data.doctorId) {
          try {
            // Try direct fetch first
            let doctorResponse = await fetch(`/api/users/${data.doctorId}`, {
              credentials: 'include',
            });
            
            if (!doctorResponse.ok) {
              // If direct fetch fails, try to find doctor by name or get all doctors
              console.log('🔄 Direct doctor fetch failed, trying to find doctor...');
              const allDoctorsResponse = await fetch('/api/users?role=DOCTOR', {
                credentials: 'include',
              });
              
              if (allDoctorsResponse.ok) {
                const allDoctors = await allDoctorsResponse.json();
                console.log('📋 All doctors:', allDoctors);
                
                // Try to find doctor by matching ID partially or by name from patient data
                const foundDoctor = allDoctors.find((d: any) => {
                  // Check if doctor ID matches the patient's doctorId (partial match)
                  const patientDocId = data.doctorId;
                  const doctorId = d.id;
                  
                  // Check if one ID contains the other
                  if (patientDocId.includes(doctorId) || doctorId.includes(patientDocId)) {
                    return true;
                  }
                  
                  // Check if doctor name matches (if available in patient data)
                  if (data.doctorName && d.name.toLowerCase().includes(data.doctorName.toLowerCase())) {
                    return true;
                  }
                  
                  return false;
                });
                
                if (foundDoctor) {
                  console.log('✅ Found matching doctor:', foundDoctor);
                  setDoctorInfo(foundDoctor);
                } else {
                  console.log('❌ No matching doctor found');
                  // Use the first doctor as fallback
                  if (allDoctors.length > 0) {
                    console.log('📋 Using first doctor as fallback:', allDoctors[0]);
                    setDoctorInfo(allDoctors[0]);
                  }
                }
              }
            } else {
              const doctorData = await doctorResponse.json();
              console.log('✅ Doctor info:', doctorData);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isSelfRegistered = !patientData?.doctorId || patientData?.doctorId === '';
  const doctorName = doctorInfo?.name || patientData?.doctorName || null;
  const doctorHospital = doctorInfo?.hospital || null;
  const doctorSpecialization = doctorInfo?.specialization || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/patient/dashboard')}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-white/40 text-sm">View your personal information</p>
        </div>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 border border-white/10"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
            {patientData?.name?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{patientData?.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm text-white/40">Patient</p>
              <span className="text-xs text-white/30">•</span>
              <span className={`text-xs font-medium ${isSelfRegistered ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {isSelfRegistered ? 'Self Registered' : 'Registered'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/40">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                CNIC: {patientData?.cnic}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {patientData?.phone}
              </span>
              {patientData?.gender && (
                <span className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  {patientData?.gender}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/patient/settings')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all duration-300"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </motion.div>

      {/* Patient Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 border border-white/10">
          <p className="text-xs text-white/40 mb-1">Full Name</p>
          <p className="text-white font-medium">{patientData?.name || 'N/A'}</p>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/10">
          <p className="text-xs text-white/40 mb-1">CNIC</p>
          <p className="text-white font-medium">{patientData?.cnic || 'N/A'}</p>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/10">
          <p className="text-xs text-white/40 mb-1">Phone Number</p>
          <p className="text-white font-medium">{patientData?.phone || 'N/A'}</p>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/10">
          <p className="text-xs text-white/40 mb-1">Age</p>
          <p className="text-white font-medium">{patientData?.age || 'N/A'}</p>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/10">
          <p className="text-xs text-white/40 mb-1">Gender</p>
          <p className="text-white font-medium">{patientData?.gender || 'N/A'}</p>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/10">
          <p className="text-xs text-white/40 mb-1">Registered Date</p>
          <p className="text-white font-medium">
            {patientData?.createdAt ? format(new Date(patientData.createdAt), 'MMM d, yyyy') : 'N/A'}
          </p>
        </div>
        {patientData?.address && (
          <div className="glass rounded-2xl p-6 border border-white/10 md:col-span-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-white/40 mb-1">Address</p>
                <p className="text-white font-medium">{patientData?.address}</p>
              </div>
            </div>
          </div>
        )}
        {/* Doctor Info */}
        <div className="glass rounded-2xl p-6 border border-white/10 md:col-span-2">
          <div className="flex items-start gap-2">
            <Stethoscope className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-white/40 mb-1">Registered Doctor</p>
              {patientData?.doctorId ? (
                <>
                  {doctorName ? (
                    <>
                      <p className="text-white font-medium">Dr. {doctorName}</p>
                      {doctorHospital && (
                        <p className="text-xs text-white/30 mt-1">
                          Hospital: {doctorHospital}
                        </p>
                      )}
                      {doctorSpecialization && (
                        <p className="text-xs text-white/30 mt-0.5">
                          Specialization: {doctorSpecialization}
                        </p>
                      )}
                      <p className="text-xs text-white/20 mt-1">
                        Doctor ID: {patientData?.doctorId}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-400 font-medium">Doctor information not available</p>
                      <p className="text-xs text-white/30 mt-1">
                        Doctor ID: {patientData?.doctorId}
                      </p>
                      <p className="text-xs text-white/20 mt-1">
                        Please contact your doctor or hospital to update your profile.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <p className="text-yellow-400 font-medium">Self Registered (No Doctor Assigned)</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}