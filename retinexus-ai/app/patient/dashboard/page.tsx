'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Calendar, Clock, Eye, Sparkles, TrendingUp,
  ArrowUpRight, User, ChevronRight, Hospital, Stethoscope,
  UserCheck, LogOut, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function PatientDashboard() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<any>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
  });

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      // Step 1: Get patient info
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      console.log('✅ Patient data:', data);
      setPatientData(data);

      // Step 2: Fetch doctor name if patient has a doctorId
      if (data.doctorId) {
        try {
          const doctorResponse = await fetch(`/api/users/${data.doctorId}`, {
            credentials: 'include',
          });
          if (doctorResponse.ok) {
            const doctorInfo = await doctorResponse.json();
            console.log('✅ Doctor info:', doctorInfo);
            setDoctorName(doctorInfo.name || null);
          } else {
            if (data.doctorName) {
              setDoctorName(data.doctorName);
            }
          }
        } catch (error) {
          console.error('Error fetching doctor info:', error);
          if (data.doctorName) {
            setDoctorName(data.doctorName);
          }
        }
      }

      // Step 3: Fetch patient reports
      const reportsResponse = await fetch('/api/patient/reports', {
        credentials: 'include',
      });
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData);
        setStats({
          totalReports: reportsData.length,
        });
      } else {
        const errorText = await reportsResponse.text();
        console.error('❌ Failed to fetch reports:', reportsResponse.status, errorText);
      }
      
    } catch (error) {
      console.error('❌ Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const now = new Date();
  const formattedDate = format(now, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(now, 'h:mm a');
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'No DR': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Mild NPDR': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Moderate NPDR': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Severe NPDR': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PDR': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const gradeDistribution = [
    { grade: 'No DR', count: reports.filter(r => r.drGrade === 'No DR').length, color: 'bg-emerald-400' },
    { grade: 'Mild NPDR', count: reports.filter(r => r.drGrade === 'Mild NPDR').length, color: 'bg-yellow-400' },
    { grade: 'Moderate NPDR', count: reports.filter(r => r.drGrade === 'Moderate NPDR').length, color: 'bg-orange-400' },
    { grade: 'Severe NPDR', count: reports.filter(r => r.drGrade === 'Severe NPDR').length, color: 'bg-red-400' },
    { grade: 'PDR', count: reports.filter(r => r.drGrade === 'PDR').length, color: 'bg-red-500' },
  ];

  const recentReports = reports.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-white/40">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if patient is self-registered or has a doctor
  const isSelfRegistered = !patientData?.doctorId || patientData?.doctorId === '';
  const displayDoctorName = doctorName || patientData?.doctorName || null;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-4 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5">
        <motion.div 
          className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-violet-500/10 border border-cyan-500/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {greeting}, <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">{patientData?.name || 'Patient'}</span>
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/40">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formattedTime}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  System Online
                </span>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs text-white/40">Total Reports</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.totalReports}</p>
        </motion.div>

        <motion.div 
          className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-white/40">Latest Report</span>
          </div>
          <p className="text-sm font-medium text-white mt-2">
            {reports.length > 0 ? format(new Date(reports[0].createdAt), 'MMM d, yyyy') : 'No reports'}
          </p>
        </motion.div>

        <motion.div 
          className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-white/40">Patient Name</span>
          </div>
          <p className="text-sm font-semibold text-white mt-2 truncate">{patientData?.name}</p>
        </motion.div>
      </div>

      {/* DR Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              DR Grade Distribution
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>Abnormal</span>
              </div>
            </div>
          </div>
          
          {reports.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <p>No reports yet</p>
              <p className="text-sm mt-1">Share your CNIC with a doctor to get scanned</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gradeDistribution.map((item, index) => {
                const percentage = reports.length > 0 ? (item.count / reports.length) * 100 : 0;
                return (
                  <motion.div 
                    key={item.grade}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-white/80">{item.grade}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/60">{item.count}</span>
                        <span className="text-white/40 text-xs w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-white/5">
                      <motion.div
                        className={`h-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}