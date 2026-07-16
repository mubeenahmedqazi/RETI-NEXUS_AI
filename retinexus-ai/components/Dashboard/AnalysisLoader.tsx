'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, Scan, Sparkles, Loader2, CheckCircle } from 'lucide-react';

export default function AnalysisLoader() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    { 
      icon: Scan, 
      label: 'Preprocessing Fundus Image', 
      description: 'Enhancing image quality and normalizing colors' 
    },
    { 
      icon: Brain, 
      label: 'AI Analysis in Progress', 
      description: 'Detecting abnormalities and lesions' 
    },
    { 
      icon: Activity, 
      label: 'Diagnostic Evaluation', 
      description: 'Grading severity and assessing risk' 
    },
    { 
      icon: Sparkles, 
      label: 'Generating Screening Report', 
      description: 'Creating Screening analysis summary' 
    },
  ];

  useEffect(() => {
    let stepDuration = 2000; // 2 seconds per step
    let totalDuration = stepDuration * steps.length;
    let increment = 100 / (totalDuration / 80); // 80ms interval
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        
        // Calculate current step based on progress
        const stepIndex = Math.min(
          Math.floor((newProgress / 100) * steps.length),
          steps.length - 1
        );
        setCurrentStep(stepIndex);
        
        // Only complete when progress reaches 100
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          return 100;
        }
        
        return newProgress;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass rounded-2xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-animated opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 via-transparent to-[#7c3aed]/5" />
        
        <div className="relative">
          {/* Header with left and right alignment */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <motion.h3 
                className="text-2xl font-bold text-white"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isComplete ? 'Analysis Complete' : 'Analyzing Retinal Image'}
              </motion.h3>
              <motion.p 
                className="text-sm text-white/40 mt-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                {isComplete ? 'Report ready for review' : 'Please wait while AI processes the image'}
              </motion.p>
            </div>
            
            {/* Circular Progress on the right - Made larger */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-28 h-28">
                  <circle
                    className="text-white/5"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="none"
                    r="50"
                    cx="56"
                    cy="56"
                  />
                  <motion.circle
                    className="text-[#00d4ff]"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="none"
                    r="50"
                    cx="56"
                    cy="56"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: 314.16, strokeDashoffset: 314.16 }}
                    animate={{ strokeDashoffset: 314.16 - (314.16 * progress) / 100 }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const Icon = step.icon;

              return (
                <motion.div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#00d4ff]/10 border border-[#00d4ff]/30 shadow-lg shadow-[#00d4ff]/5' 
                      : isCompleted 
                      ? 'bg-emerald-500/10 border border-emerald-500/30' 
                      : 'bg-white/5 border border-white/5 opacity-50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-6 h-6 text-[#00d4ff]" />
                      </motion.div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center">
                        <Icon className="w-3 h-3 text-white/40" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      isActive ? 'text-[#00d4ff]' : 
                      isCompleted ? 'text-emerald-400' : 
                      'text-white/60'
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-sm ${
                      isActive ? 'text-white/60' : 'text-white/40'
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {isActive && (
                    <motion.div 
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#00d4ff]"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div 
            className="mt-6 text-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20">
              <Loader2 className="w-4 h-4 text-[#00d4ff] animate-spin" />
              <span className="text-sm text-[#00d4ff] font-medium">
                {isComplete ? 'Finalizing results...' : 'Processing with AI model...'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}