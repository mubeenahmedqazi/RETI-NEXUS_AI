'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Calendar, MapPin, FileText, 
  ArrowLeft, Sparkles, Clock, Eye, X,
  Activity, CheckCircle, AlertTriangle, Search,
  Download, Share2, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Button from '@/components/Common/Button';
import ReportDisplay from '@/components/Dashboard/ReportDisplay';

interface Patient {
  id: string;
  cnic: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  address: string;
  createdAt: string;
  reports: any[];
}

// ✅ Sharp-edged circular loader
const SharpLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-4">
        {/* Outer square with sharp edges - rotates clockwise */}
        <motion.div
          className="absolute inset-0 border-4 border-cyan-500/20"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* Inner square with sharp edges - rotates counter-clockwise */}
        <motion.div
          className="absolute inset-2 border-4 border-cyan-500/40"
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* Center dot with sharp edges */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-cyan-400" />
        </div>
      </div>
      <p className="text-white/60">Loading patient...</p>
    </div>
  </div>
);

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cnic = params.cnic as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cnic) {
      loadPatient();
    }
  }, [cnic]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 CNIC from params:', cnic);
      
      let url = `/api/patients/${encodeURIComponent(cnic)}`;
      console.log('🔍 Fetching from:', url);
      
      let response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (response.status === 404) {
        const numericCnic = cnic.replace(/-/g, '');
        console.log('🔄 Trying numeric CNIC:', numericCnic);
        
        const allResponse = await fetch('/api/patients');
        if (allResponse.ok) {
          const allPatients = await allResponse.json();
          const found = allPatients.find((p: any) => {
            const pNumeric = p.cnic.replace(/-/g, '');
            return pNumeric === numericCnic;
          });
          
          if (found) {
            console.log(' Found patient by numeric match:', found);
            url = `/api/patients/${encodeURIComponent(found.cnic)}`;
            response = await fetch(url);
          }
        }
      }
      
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats
        const patientData = data.patient || data;
        setPatient(patientData);
      } else if (response.status === 404) {
        const errorData = await response.json();
        console.log('Patient not found:', errorData);
        setError(`Patient not found with CNIC: ${cnic}`);
        toast.error('Patient not found. Please check the CNIC format.');
      } else {
        const errorData = await response.json();
        console.error('Error:', errorData);
        setError(errorData.error || 'Failed to load patient');
        toast.error(errorData.error || 'Failed to load patient');
      }
    } catch (error) {
      console.error('Failed to load patient:', error);
      setError('Network error. Please try again.');
      toast.error('Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  const getGradeBadge = (grade: string) => {
    switch(grade) {
      case 'No DR': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Mild NPDR': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Moderate NPDR': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Severe NPDR': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PDR': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const toggleReport = (reportId: string) => {
    setSelectedReport(selectedReport === reportId ? null : reportId);
  };

  // Helper function to safely format date
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  // Helper function to safely format time
  const formatTime = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return format(date, 'h:mm a');
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return <SharpLoader />;
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push('/dashboard/patients')}
            className="text-white/60 hover:text-white"
          >
            Back to Patients
          </Button>
        </div>
        
        <div className="glass rounded-2xl p-12 text-center border border-red-500/20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Search className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Patient Not Found</h3>
          <p className="text-white/40 max-w-md mx-auto">
            {error || `No patient found with CNIC: ${cnic}`}
          </p>
          <p className="text-white/30 text-sm mt-2">
            Please check the CNIC format and try again.
          </p>
          <p className="text-white/20 text-xs mt-1">
            Expected format: 35201-7329319-9
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => router.push('/dashboard/patients')}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors duration-300"
            >
              View All Patients
            </button>
            <button
              onClick={() => router.push('/dashboard/patients')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
            >
              Add New Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => router.push('/dashboard/patients')}
          className="text-white/60 hover:text-white"
        >
          Back to Patients
        </Button>
      </div>

      {/* Patient Info */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-violet-500/10 border border-cyan-500/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20">
                <User className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{patient.name}</h1>
                <p className="text-sm text-white/40">CNIC: {patient.cnic}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/40">
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {patient.phone || 'N/A'}
              </span>
              {patient.age && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Age: {patient.age}
                </span>
              )}
              {patient.gender && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {patient.gender}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Added: {formatDate(patient.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push(`/dashboard/upload?cnic=${patient.cnic}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
          >
            
            Upload Scan
          </button>
        </div>
        {patient.address && (
          <div className="mt-3 text-sm text-white/40 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {patient.address}
          </div>
        )}
      </motion.div>

      {/* Reports Section */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Reports ({patient.reports?.length || 0})
          </h2>
        </div>

        {patient.reports && patient.reports.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
            {patient.reports.map((report, index) => {
              const isExpanded = selectedReport === report.id;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass rounded-xl border transition-all duration-300 overflow-hidden ${
                    isExpanded 
                      ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                      : 'border-white/10 hover:border-cyan-500/30'
                  }`}
                >
                  {/* Report Header - Click to expand */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors duration-300"
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-cyan-500/10 flex-shrink-0">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${getGradeBadge(report.drGrade)}`}>
                              {report.drGrade || 'N/A'}
                            </span>
                            <span className="text-xs text-white/40">
                              • {(report.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(report.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(report.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Report Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 max-h-[500px] overflow-y-auto scrollbar-hide">
                          <ReportDisplay 
                            report={report.reportData} 
                            onReset={() => toggleReport(report.id)}
                            hideActions={true}
                          />
                          
                          {/* Report Actions */}
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Download className="w-4 h-4" />}
                              className="text-xs"
                              onClick={() => {
                                window.print();
                              }}
                            >
                              Download Report
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Share2 className="w-4 h-4" />}
                              className="text-xs"
                            >
                              Share
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<X className="w-4 h-4" />}
                              className="text-xs"
                              onClick={() => toggleReport(report.id)}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">
            <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <p className="text-lg font-medium text-white/60 mb-2">No Reports Yet</p>
            <p className="text-sm">Upload a scan for this patient to see reports here</p>
            <button
              onClick={() => router.push(`/dashboard/upload?cnic=${patient.cnic}`)}
              className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 mx-auto"
            >
              
              Upload first scan →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}