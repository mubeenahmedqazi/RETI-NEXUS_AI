'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, RotateCcw, Share2, Eye, Brain, Heart, 
  AlertTriangle, CheckCircle, Image, Hash, Loader2, Check, X, ZoomIn 
} from 'lucide-react';
import { ReportData } from '@/types/report';
import Button from '../Common/Button';
import { saveReport } from '@/services/api';
import { toast } from 'react-toastify';

interface ReportDisplayProps {
  report: ReportData;
  onReset: () => void;
  hideActions?: boolean;
  patientCnic?: string;
  patientName?: string;
  patientId?: string;
}

export default function ReportDisplay({ 
  report, 
  onReset, 
  hideActions = false,
  patientCnic: propPatientCnic,
  patientName: propPatientName,
  patientId: propPatientId
}: ReportDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [patientCnic, setPatientCnic] = useState<string>(propPatientCnic || '');
  const [patientName, setPatientName] = useState<string>(propPatientName || '');
  const [patientId, setPatientId] = useState<string>(propPatientId || '');
  const reportRef = useRef<HTMLDivElement>(null);

  // ✅ SCROLL TO TOP WHEN REPORT LOADS
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [report]);

  // Get doctor ID from session
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setDoctorId(data.id || data.doctorId || '');
        }
      } catch (error) {
        console.error('Failed to fetch doctor info:', error);
      }
    };
    fetchDoctorInfo();
  }, []);

  // Get patient info from URL if not provided as props
  useEffect(() => {
    if (!propPatientCnic && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cnic = params.get('cnic') || params.get('patientCnic') || '';
      const name = params.get('patientName') || params.get('name') || '';
      const id = params.get('patientId') || params.get('id') || '';
      
      if (cnic) setPatientCnic(cnic);
      if (name) setPatientName(name);
      if (id) setPatientId(id);
    }
  }, [propPatientCnic]);

  // Get total lesions from lesionCounts if available
  const totalLesions = report.lesionCounts?.total ?? report.lesions?.length ?? 0;

  // Map grade to number
  const getGradeNumber = (grade: string): number => {
    const gradeMap: Record<string, number> = {
      'No DR': 0,
      'Mild NPDR': 1,
      'Moderate NPDR': 2,
      'Severe NPDR': 3,
      'PDR': 4
    };
    return gradeMap[grade] ?? 0;
  };

  // Get color for grade number
  const getGradeColor = (grade: string): string => {
    const gradeMap: Record<string, string> = {
      'No DR': 'text-emerald-400',
      'Mild NPDR': 'text-yellow-400',
      'Moderate NPDR': 'text-orange-400',
      'Severe NPDR': 'text-red-400',
      'PDR': 'text-red-500'
    };
    return gradeMap[grade] ?? 'text-white';
  };

  const gradeNumber = getGradeNumber(report.drGrade?.grade || 'No DR');
  const gradeColor = getGradeColor(report.drGrade?.grade || 'No DR');

  // Helper function to get the correct image URL
  const getImageUrl = (filename: string | undefined) => {
    if (!filename || filename === 'Failed' || filename === 'None' || filename === 'null') {
      return null;
    }
    const cleanFilename = filename.replace(/^.*[\\\/]/, '');
    return `http://127.0.0.1:8000/output_results/${cleanFilename}`;
  };

  // Image labels for display
  const imageLabels: Record<string, string> = {
    enhanced: 'Enhanced Image',
    vessel_mask: 'Vessel Mask',
    detected_lesions: 'Lesion Detection',
    gradcam: 'Grad-CAM Heatmap'
  };

  const imageColors: Record<string, string> = {
    enhanced: 'border-cyan-500/30',
    vessel_mask: 'border-emerald-500/30',
    detected_lesions: 'border-yellow-500/30',
    gradcam: 'border-purple-500/30'
  };

  // --- PDF DOWNLOAD FUNCTION ---
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
      window.print();
    } catch (error) {
      console.error("Print failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // --- APPROVE REPORT FUNCTION ---
  const handleApprove = async () => {
    if (isApproved) {
      toast.info('Report already approved!', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!patientCnic) {
      toast.error('❌ Patient CNIC is missing. Please go back and select a patient.', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    if (!doctorId) {
      toast.error('❌ Doctor information not found. Please refresh and try again.', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    try {
      setIsApproving(true);
      
      const reportData = {
        patientId: patientId || patientCnic,
        patientCnic: patientCnic,
        patientName: patientName || 'Patient',
        doctorId: doctorId,
        drGrade: report.drGrade?.grade || 'Unknown',
        confidence: report.drGrade?.confidence || 0,
        description: report.drGrade?.description || '',
        imageUrl: report.imageUrl || '',
        processedAt: report.processedAt || new Date().toISOString(),
        reportData: report,
        phone: ''
      };

      console.log('📤 Saving report with data:', reportData);

      const result = await saveReport(reportData);

      if (result.success) {
        setIsApproved(true);
        toast.success(` Report approved and saved successfully for ${patientName}!`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error: any) {
      console.error('Approve error:', error);
      
      const errorMessage = error.message || 'Failed to save report. Please try again.';
      
      if (errorMessage.includes('already exists')) {
        toast.error(`❌ ${errorMessage}`, {
          position: "top-right",
          autoClose: 6000,
        });
      } else {
        toast.error(`❌ ${errorMessage}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } finally {
      setIsApproving(false);
    }
  };

  // --- IMAGE POPUP FUNCTIONS ---
  const openImagePopup = (url: string, label: string) => {
    setSelectedImage(url);
    setSelectedLabel(label);
    document.body.style.overflow = 'hidden';
  };

  const closeImagePopup = () => {
    setSelectedImage(null);
    setSelectedLabel('');
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      {/* Wrapper with ref for scrolling */}
      <div ref={reportRef} id="pdf-report-content" className="space-y-6 p-2">
        {/* Patient Info Banner */}
        {patientName && patientCnic && (
          <div className="glass rounded-2xl p-4 border border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40">Patient</p>
                <p className="text-lg font-semibold text-white">{patientName}</p>
                <p className="text-sm text-white/40">CNIC: {patientCnic}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/40">Report Status</p>
                <span className={`text-sm font-medium ${isApproved ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {isApproved ? ' Approved' : '⏳ Pending Approval'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ DR GRADE - TOP OF THE PAGE */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            Diabetic Retinopathy Grade
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-white">{report.drGrade?.grade || 'N/A'}</p>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${gradeColor} bg-white/5`}>
                  <span className={`text-lg font-bold ${gradeColor}`}>Grade {gradeNumber}</span>
                </div>
              </div>
              <p className="text-sm text-white/40 mt-1">{report.drGrade?.description || ''}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/40">Confidence</p>
              <p className="text-2xl font-bold text-cyan-400">
                {((report.drGrade?.confidence || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-4">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-600" 
              initial={{ width: 0 }} 
              animate={{ width: `${(report.drGrade?.confidence || 0) * 100}%` }} 
              transition={{ duration: 0.8 }} 
            />
          </div>
        </div>

        {/* ✅ Biomarkers - Updated */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            Biomarkers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vessel Tortuosity */}
            {report.biomarkers?.filter(b => b.name === 'Vessel Tortuosity').map((biomarker, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }} 
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{biomarker.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${biomarker.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {biomarker.status}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-xl font-bold ${biomarker.status === 'normal' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {biomarker.value}
                  </span>
                  <span className="text-xs text-white/40">{biomarker.unit}</span>
                </div>
                <div className="text-xs text-white/30 mt-1">
                  Normal: {biomarker.normalRange[0]} - {biomarker.normalRange[1]} {biomarker.unit}
                </div>
              </motion.div>
            ))}

            {/* Vessel Density */}
            {report.biomarkers?.filter(b => b.name === 'Vessel Density').map((biomarker, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }} 
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{biomarker.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${biomarker.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {biomarker.status}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-xl font-bold ${biomarker.status === 'normal' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {biomarker.value}
                  </span>
                  <span className="text-xs text-white/40">{biomarker.unit}</span>
                </div>
                <div className="text-xs text-white/30 mt-1">
                  Normal: {biomarker.normalRange[0]} - {biomarker.normalRange[1]} {biomarker.unit}
                </div>
              </motion.div>
            ))}

            {/* Branching Points */}
            {report.biomarkers?.filter(b => b.name === 'Branching Points').map((biomarker, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }} 
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{biomarker.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${biomarker.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {biomarker.status}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-xl font-bold ${biomarker.status === 'normal' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {biomarker.value}
                  </span>
                  <span className="text-xs text-white/40">{biomarker.unit}</span>
                </div>
                <div className="text-xs text-white/30 mt-1">
                  Normal: {biomarker.normalRange[0]} - {biomarker.normalRange[1]} {biomarker.unit}
                </div>
              </motion.div>
            ))}

            {/* ✅ Arteriolar to Venular Ratio - ADDED */}
            {report.biomarkers?.filter(b => b.name === 'Arteriolar to Venular Ratio').map((biomarker, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }} 
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">AVR</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${biomarker.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {biomarker.status}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-xl font-bold ${biomarker.status === 'normal' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {biomarker.value}
                  </span>
                  <span className="text-xs text-white/40">{biomarker.unit}</span>
                </div>
                <div className="text-xs text-white/30 mt-1">
                  Normal: {biomarker.normalRange[0]} - {biomarker.normalRange[1]} {biomarker.unit}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Lesions - Updated to show only lesion counts without individual biomarker cards */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Lesion Detection ({totalLesions})
          </h3>
          
          {report.lesionCounts ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-all">
                <p className="text-2xl font-bold text-red-400">{report.lesionCounts.microaneurysms || 0}</p>
                <p className="text-xs text-white/40 mt-1">Microaneurysms</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-all">
                <p className="text-2xl font-bold text-orange-400">{report.lesionCounts.haemorrhages || 0}</p>
                <p className="text-xs text-white/40 mt-1">Haemorrhages</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-all">
                <p className="text-2xl font-bold text-yellow-400">{report.lesionCounts.hardExudates || 0}</p>
                <p className="text-xs text-white/40 mt-1">Hard Exudates</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-all">
                <p className="text-2xl font-bold text-blue-400">{report.lesionCounts.softExudates || 0}</p>
                <p className="text-xs text-white/40 mt-1">Soft Exudates</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-white/40">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
              <p>No lesions detected</p>
            </div>
          )}
        </div>

        {/* Risk Factors */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            Risk Factors
          </h3>
          <div className="space-y-3">
            {report.riskFactors?.map((factor, index) => (
              <div key={index} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{factor.name}</span>
                  <span className={`text-sm font-bold ${factor.level >= 0.7 ? 'text-red-400' : factor.level >= 0.4 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {(factor.level * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-1">{factor.description}</p>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                  <motion.div 
                    className={`h-full rounded-full ${factor.level >= 0.7 ? 'bg-red-400' : factor.level >= 0.4 ? 'bg-yellow-400' : 'bg-emerald-400'}`} 
                    initial={{ width: 0 }} 
                    animate={{ width: `${factor.level * 100}%` }} 
                    transition={{ duration: 0.6, delay: index * 0.1 }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Output Images */}
        {report.images && Object.keys(report.images).length > 0 && (
          <div className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-cyan-400" />
              Analysis Output Images
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report.images).map(([key, filename]) => {
                const imageUrl = getImageUrl(filename as string);
                
                if (!imageUrl) {
                  return (
                    <div key={key} className={`p-4 rounded-xl border ${imageColors[key] || 'border-white/10'} bg-white/5 text-center`}>
                      <div className="text-3xl mb-2">🖼️</div>
                      <p className="text-xs text-white/40">{imageLabels[key] || key}</p>
                      <p className="text-xs text-red-400 mt-1">Not available</p>
                    </div>
                  );
                }
                
                return (
                  <motion.div
                    key={key}
                    className={`relative rounded-xl overflow-hidden border ${imageColors[key] || 'border-white/10'} bg-white/5 group cursor-pointer`}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,212,255,0.2)' }}
                    transition={{ duration: 0.3 }}
                    onClick={() => openImagePopup(imageUrl, imageLabels[key] || key)}
                  >
                    <img 
                      src={imageUrl}
                      alt={imageLabels[key] || key}
                      className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                      <p className="text-xs text-white/80 font-medium">
                        {imageLabels[key] || key.replace('_', ' ').toUpperCase()}
                      </p>
                      <ZoomIn className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] text-white/60">Click to enlarge</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Image Popup Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImagePopup}
          >
            <motion.div
              className="relative max-w-[90vw] max-h-[90vh]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-4 -right-4 z-10 p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors duration-300 shadow-xl"
                onClick={closeImagePopup}
              >
                <X className="w-6 h-6" />
              </button>

              <div className="rounded-2xl overflow-hidden bg-[#0a0a1a] border border-white/10 shadow-2xl shadow-cyan-500/20">
                <img 
                  src={selectedImage}
                  alt={selectedLabel}
                  className="max-w-[85vw] max-h-[80vh] object-contain"
                />
                <div className="p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-white text-lg font-bold text-center">{selectedLabel}</p>
                  <p className="text-white/40 text-sm text-center mt-1">
                    Click anywhere to close • Press ESC
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {!hideActions && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Button 
            variant={isApproved ? "success" : "primary"}
            icon={isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : isApproved ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            onClick={handleApprove}
            disabled={isApproving || isApproved || !patientCnic || !doctorId}
            className={`min-w-[160px] ${isApproved ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : ''}`}
            glow={!isApproved}
          >
            {isApproving ? 'Saving...' : isApproved ? ' Approved' : 'Approve Report'}
          </Button>

          <Button 
            variant="secondary" 
            icon={isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="min-w-[140px]"
          >
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>

          <Button 
            variant="secondary" 
            icon={<Share2 className="w-4 h-4" />}
            className="min-w-[140px]"
          >
            Share Report
          </Button>
          
          <Button 
            variant="outline" 
            icon={<RotateCcw className="w-4 h-4" />} 
            onClick={onReset}
            className="min-w-[140px]"
          >
            New Scan
          </Button>
        </div>
      )}
    </>
  );
}