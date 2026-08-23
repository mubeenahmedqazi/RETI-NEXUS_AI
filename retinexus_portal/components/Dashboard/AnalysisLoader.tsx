'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, ScanEye, Network, ScanSearch, FlaskConical, Gauge, FileText } from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';
import Timeline, { TimelineStep } from '@/components/ui/Timeline';
import { Swirling } from '@/components/ui/Swirling';

const steps: TimelineStep[] = [
  { icon: Upload, label: 'Image Upload', description: 'Receiving and validating the fundus photograph' },
  { icon: ScanEye, label: 'Quality Check', description: 'Assessing blur, brightness, contrast & field of view' },
  { icon: Network, label: 'Vessel Segmentation', description: 'Mapping the retinal vascular tree' },
  { icon: ScanSearch, label: 'Lesion Detection', description: 'Locating microaneurysms, haemorrhages & exudates' },
  { icon: FlaskConical, label: 'Biomarker Extraction', description: 'Computing vessel density, tortuosity & AV ratio' },
  { icon: Gauge, label: 'Disease Grading', description: 'Grading DR severity with a calibrated confidence score' },
  { icon: FileText, label: 'Report Generation', description: 'Compiling the clinical screening report' },
];

export default function AnalysisLoader() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const totalDuration = 30000;
    const tickMs = 80;
    const increment = 100 / (totalDuration / tickMs);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        const stepIndex = Math.min(Math.floor((newProgress / 100) * steps.length), steps.length - 1);
        setCurrentStep(stepIndex);
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          return 100;
        }
        return newProgress;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="surface rounded-2xl p-6 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="text-left">
              <motion.h3
                className="text-xl md:text-2xl font-bold"
                style={{ color: 'var(--foreground)' }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isComplete ? 'Analysis Complete' : 'Analyzing Retinal Image'}
              </motion.h3>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {isComplete ? 'Report ready for review' : 'Please wait while the AI pipeline processes the image'}
              </p>
            </div>

            <ProgressRing
              value={progress}
              size={104}
              strokeWidth={7}
              label={<span className="text-xl">{Math.round(progress)}%</span>}
            />
          </div>

          <Timeline steps={steps} currentStep={currentStep} complete={isComplete} />

          <motion.div className="mt-6 text-center" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20">
              <Swirling className="w-4 h-4" style={{ color: 'var(--brand-secondary)' }} />
              <span className="text-sm font-medium text-[var(--brand-accent)]">
                {isComplete ? 'Finalizing results...' : 'Processing with AI model...'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
