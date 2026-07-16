'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, FileText, Calendar, Clock, Eye, Sparkles, TrendingUp,
  ArrowUpRight, ChevronRight, Hospital, Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { getReports, getPatients } from '@/services/api';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState({
    name: 'Doctor',
    email: '',
    hospital: 'Not specified',
    phone: '',
    specialization: 'General',
  });

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setDoctorData({
          name: data.name || 'Doctor',
          email: data.email || '',
          hospital: data.hospital || 'Not specified',
          phone: data.phone || '',
          specialization: data.specialization || 'General',
        });
        await loadData();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to load doctor data:', error);
    }
  };

  const loadData = async () => {
    try {
      const [reportsData, patientsData] = await Promise.all([
        getReports(),
        getPatients(),
      ]);
      setReports(reportsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const now = new Date();
  const formattedDate = format(now, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(now, 'h:mm a');
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const totalPatients = patients.length;
  const totalReports = reports.length;
  const recentReports = reports.slice(0, 3);

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
                  {greeting}, <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">Dr. {doctorData.name}</span>
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
            <button
              onClick={() => router.push('/dashboard/patients')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              
              New Retinal Scan
            </button>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-white/40">Specialization</p>
              <p className="text-sm font-semibold text-white">{doctorData.specialization}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Hospital className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/40">Hospital</p>
              <p className="text-sm font-semibold text-white">{doctorData.hospital}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs text-white/40">Total Patients</span>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400/60" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalPatients}</p>
        </motion.div>

        <motion.div 
          className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-white/40">Total Reports</span>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400/60" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalReports}</p>
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
              <button
                onClick={() => router.push('/dashboard/upload')}
                className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm"
              >
                Upload your first scan →
              </button>
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

      {/* Recent Reports */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Recent Reports
          </h3>
          <button
            onClick={() => router.push('/dashboard/reports')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors duration-300"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        {recentReports.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <p>No reports yet</p>
            <button
              onClick={() => router.push('/dashboard/upload')}
              className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm"
            >
              Upload your first scan →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 cursor-pointer"
                onClick={() => router.push('/dashboard/reports')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 rounded-lg bg-cyan-500/10 flex-shrink-0">
                      <FileText className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {report.patientName || 'Unknown Patient'}
                      </p>
                      <p className="text-xs text-white/40">ID: {report.patientId}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getGradeColor(report.drGrade)} border`}>
                    {report.drGrade || 'N/A'}
                  </span>
                  <span className="text-xs text-white/40">
                    {format(new Date(report.approvedAt || report.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {(report.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}