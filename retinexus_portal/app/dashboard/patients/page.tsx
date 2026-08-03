'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, UserPlus, Users, Filter, X, Upload, Edit2, Save, 
  Phone, MapPin, User, Calendar, Heart, FileText, Activity,
  AlertTriangle, CheckCircle, Eye, Stethoscope, Hospital,
  Scan, Clock, ArrowRight, ChevronRight, Check, UserCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPatients } from '@/services/api';
import PatientCard from '@/components/Patient/PatientCard';
import AddPatientModal from '@/components/Patient/AddPatientModal';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Loader, { SectionLoader } from '@/components/ui/Loader';

interface Patient {
  id: string;
  cnic: string;
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
  doctor?: {
    id: string;
    name: string;
    email: string;
    hospital: string;
    phone: string;
  };
  _count?: {
    reports: number;
  };
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});
  const [updating, setUpdating] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultType, setSearchResultType] = useState<'own' | 'other' | 'none'>('none');
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanPatient, setScanPatient] = useState<Patient | null>(null);
  const [approvingReport, setApprovingReport] = useState<string | null>(null);
  const [isAddingPatient, setIsAddingPatient] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      setShowSearchResults(false);
      setSelectedPatient(null);
      setSearchError('');
      setSearchResultType('none');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResultType('none');

    try {
      const cleanCnic = searchTerm.trim();
      
      const response = await fetch(`/api/patients/${encodeURIComponent(cleanCnic)}`);
      const data = await response.json();

      if (data.exists) {
        if (data.belongsToCurrentDoctor) {
          setSelectedPatient(data.patient);
          setEditFormData(data.patient);
          setSearchResultType('own');
          setSearchError('');
          setFilteredPatients([data.patient]);
          setShowSearchResults(true);
        } else {
          setSelectedPatient(data.patient);
          setSearchResultType('other');
          
          const patient = data.patient;
          const doctorName = patient.doctor?.name;
          const hospitalName = patient.doctor?.hospital;
          
          if (!doctorName || doctorName === 'Unknown' || !patient.doctorId || patient.doctorId === '' || patient.doctorId === null) {
            setSearchError(`ℹ️ This patient is Self Registered. No doctor assigned yet.`);
          } else {
            setSearchError(`ℹ️ This patient is registered with Dr. ${doctorName}${hospitalName ? ` at ${hospitalName}` : ''}`);
          }
          
          setFilteredPatients([data.patient]);
          setShowSearchResults(true);
        }
      } else {
        setSelectedPatient(null);
        setSearchResultType('none');
        setSearchError(`❌ No patient found with CNIC: ${searchTerm}`);
        setFilteredPatients([]);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setSearchError('Error searching for patient. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddPatient = async (patientData: any) => {
    // Prevent double submission
    if (isAddingPatient) return;
    
    setIsAddingPatient(true);
    try {
      // Check if CNIC exists
      const checkResponse = await fetch(`/api/patients/${encodeURIComponent(patientData.cnic)}`);
      const checkData = await checkResponse.json();
      
      if (checkData.exists) {
        const doctorName = checkData.patient?.doctor?.name || 'Unknown';
        toast.error(` Patient with CNIC ${patientData.cnic} already exists with Dr. ${doctorName}. Please use a different CNIC.`);
        setIsAddingPatient(false);
        return;
      }

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });

      // Parse response properly
      let result;
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid server response');
      }

      if (response.ok && result.success) {
        // Success - show the default password
        const defaultPassword = result.defaultPassword || patientData.name.toLowerCase().replace(/\s/g, '');
        toast.success(` Patient added successfully!\nDefault Password: ${defaultPassword}\nPlease share this with the patient.`, {
          autoClose: 8000,
        });
        
        await loadPatients();
        setShowAddModal(false);
        setSelectedPatient(null);
      } else {
        // Error from server
        
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Failed to add patient');
    } finally {
      setIsAddingPatient(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredPatients(patients);
    setShowSearchResults(false);
    setSelectedPatient(null);
    setIsEditing(false);
    setSearchError('');
    setSearchResultType('none');
  };

  const handleNewScan = (patient: Patient) => {
    setScanPatient(patient);
    setShowScanModal(true);
  };

  const confirmScan = () => {
    if (scanPatient) {
      router.push(`/dashboard/upload?patientId=${scanPatient.id}&patientCnic=${scanPatient.cnic}&patientName=${scanPatient.name}`);
    }
    setShowScanModal(false);
    setScanPatient(null);
  };

  const handleApproveReport = async (reportId: string, patientId: string) => {
    setApprovingReport(reportId);
    try {
      const response = await fetch(`/api/reports/${reportId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        toast.success('✅ Report approved successfully!');
        await loadPatients();
        if (selectedPatient) {
          const refreshResponse = await fetch(`/api/patients/${encodeURIComponent(selectedPatient.cnic)}`);
          const refreshData = await refreshResponse.json();
          if (refreshData.exists) {
            setSelectedPatient(refreshData.patient);
          }
        }
      } else {
        toast.error('Failed to approve report');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Failed to approve report');
    } finally {
      setApprovingReport(null);
    }
  };

  const getGradeBadge = (grade: string) => {
    switch(grade) {
      case 'No DR': 
        return { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Normal' };
      case 'Mild NPDR': 
        return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Mild' };
      case 'Moderate NPDR': 
        return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Moderate' };
      case 'Severe NPDR': 
        return { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Severe' };
      case 'PDR': 
        return { color: 'bg-red-500/20 text-red-500 border-red-500/30', label: 'PDR' };
      default: 
        return { color: 'bg-white/10 text-white/60 border-white/10', label: 'N/A' };
    }
  };

  const getPatientStatus = (reports: any[]) => {
    if (!reports || reports.length === 0) {
      return { label: 'No Reports', color: 'text-white/30' };
    }
    const latestReport = reports[0];
    if (latestReport.drGrade === 'No DR') {
      return { label: 'Healthy', color: 'text-emerald-400' };
    }
    if (['Mild NPDR', 'Moderate NPDR'].includes(latestReport.drGrade)) {
      return { label: 'Under Observation', color: 'text-yellow-400' };
    }
    return { label: 'Requires Attention', color: 'text-red-400' };
  };

  if (loading) {
    return <SectionLoader label="Loading patients..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Patients</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Manage your patients and their records
            {showSearchResults && selectedPatient && (
              <span className="ml-2 text-[var(--brand-secondary)]">
                • {filteredPatients.length} results found
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          Add New Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="surface rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />
            <input
              type="text"
              placeholder="Search by CNIC to view patient records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-transparent border rounded-xl pl-10 pr-4 py-2.5 ring-focus outline-none transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--subtle-foreground)' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2.5 rounded-xl bg-[var(--brand-secondary)]/10 border border-[var(--brand-secondary)]/25 text-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)]/20 transition-all duration-300 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader size="sm" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                setFilteredPatients(patients);
                setSearchTerm('');
                setShowSearchResults(false);
                setSelectedPatient(null);
                setIsEditing(false);
                setSearchError('');
                setSearchResultType('none');
              }}
              className="px-4 py-2.5 rounded-xl surface hover:bg-[var(--muted)] transition-all duration-300"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Result Indicator */}
        {searchResultType !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-xl text-sm flex items-center gap-2 ${
              searchResultType === 'own'
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400'
            }`}
          >
            {searchResultType === 'own' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {searchResultType === 'own'
              ? 'Patient found in your records.'
              : searchError
            }
          </motion.div>
        )}

        {/* Search Error */}
        {searchError && searchResultType === 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/25 text-red-500"
          >
            {searchError}
          </motion.div>
        )}
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredPatients.length === 0 ? (
            <div className="col-span-full surface rounded-2xl p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--subtle-foreground)' }} />
              <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
                {searchTerm ? 'No patients found matching your search' : 'No patients yet'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--subtle-foreground)' }}>
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Add your first patient to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Add Patient
                </button>
              )}
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="mt-4 px-6 py-2 rounded-xl surface hover:bg-[var(--muted)] transition-all duration-300"
                  style={{ color: 'var(--foreground)' }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredPatients.map((patient, index) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddPatient}
      />

      {/* Scan Confirmation Modal */}
      <AnimatePresence>
        {showScanModal && scanPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowScanModal(false);
              setScanPatient(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="surface rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--brand-secondary)]/10 border-2 border-[var(--brand-secondary)]/25 flex items-center justify-center mb-4">
                  <Scan className="w-8 h-8 text-[var(--brand-secondary)]" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Confirm Retinal Scan</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                  You are about to perform a retinal scan for:
                </p>
                <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--muted)' }}>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{scanPatient.name}</p>
                  <p className="text-sm" style={{ color: 'var(--subtle-foreground)' }}>CNIC: {scanPatient.cnic}</p>
                  {scanPatient.doctor && scanPatient.doctorId !== scanPatient.doctor?.id && (
                    <p className="text-xs text-amber-500 mt-1">
                      Registered with: Dr. {scanPatient.doctor.name}
                    </p>
                  )}
                  {(!scanPatient.doctorId || scanPatient.doctorId === '' || scanPatient.doctorId === null) && (
                    <p className="text-xs text-amber-500 mt-1">
                      Self Registered
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowScanModal(false);
                      setScanPatient(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-xl surface hover:bg-[var(--muted)] transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmScan}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                  >
                    <Scan className="w-4 h-4 inline mr-2" />
                    Proceed
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}