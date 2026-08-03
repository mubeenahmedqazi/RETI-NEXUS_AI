'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Calendar, Clock, Eye, X, ZoomIn } from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import Loader from '@/components/ui/Loader';

interface ImagesCardProps {
  originalImage: string;
  processedAt: string;
  images?: {
    enhanced: string;
    vessel_mask: string;
    detected_lesions: string;
    gradcam: string;
    [key: string]: string;
  };
}

export default function ImagesCard({ originalImage, processedAt, images }: ImagesCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  const imageLabels = {
    enhanced: 'Enhanced Image',
    vessel_mask: 'Vessel Mask',
    detected_lesions: 'Lesion Detection',
    gradcam: 'Grad-CAM Heatmap'
  };

  const imageColors = {
    enhanced: 'border-cyan-500/30',
    vessel_mask: 'border-emerald-500/30',
    detected_lesions: 'border-yellow-500/30',
    gradcam: 'border-purple-500/30'
  };

  // Helper function to get the correct image URL
  const getImageUrl = (filename: string | undefined) => {
    if (!filename || filename === 'Failed' || filename === 'None' || filename === 'null') {
      return null;
    }
    const cleanFilename = filename.replace(/^.*[\\\/]/, '');
    return `http://127.0.0.1:8000/output_results/${cleanFilename}`;
  };

  // ✅ OPEN IMAGE - Shows large popup
  const openImage = (url: string, label: string) => {
    setSelectedImage(url);
    setSelectedLabel(label);
    document.body.style.overflow = 'hidden';
  };

  // ✅ CLOSE IMAGE - Closes popup
  const closeImage = () => {
    setSelectedImage(null);
    setSelectedLabel('');
    document.body.style.overflow = 'auto';
  };

  // Keyboard ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <motion.div 
        className="glass rounded-2xl p-6 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#00d4ff]/10 rounded-xl">
            <Image className="w-5 h-5 text-[#00d4ff]" />
          </div>
          <h3 className="text-lg font-semibold text-white">Analysis Output Images</h3>
          <span className="text-xs text-white/30 ml-auto">Click to enlarge</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Image */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white/60">Original Fundus Image</h4>
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Retinal Scan
              </span>
            </div>
            <motion.div 
              className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 aspect-square cursor-pointer group"
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(0,212,255,0.15)' }}
              transition={{ duration: 0.3 }}
              onClick={() => openImage(originalImage, 'Original Fundus Image')}
            >
              <img 
                src={originalImage} 
                alt="Original fundus image" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <ZoomIn className="w-10 h-10 text-white/80" />
                  <span className="text-sm text-white/80 font-medium">Click to enlarge</span>
                </div>
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] text-white/80">🔍 Click to zoom</span>
              </div>
            </motion.div>
          </div>

          {/* Output Images Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white/60">AI Output Images</h4>
              <span className="text-xs text-white/40 flex items-center gap-1">
                <ZoomIn className="w-3 h-3" />
                Click to enlarge
              </span>
            </div>
            
            {images && Object.keys(images).length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(images).map(([key, filename]) => {
                  const imageUrl = getImageUrl(filename);
                  
                  if (!imageUrl) {
                    return (
                      <div 
                        key={key} 
                        className={`rounded-xl border ${imageColors[key as keyof typeof imageColors] || 'border-white/10'} bg-white/5 p-4 text-center aspect-square flex flex-col items-center justify-center`}
                      >
                        <span className="text-3xl mb-2">🖼️</span>
                        <p className="text-xs text-white/40">{imageLabels[key as keyof typeof imageLabels] || key}</p>
                        <p className="text-xs text-red-400 mt-1">Not available</p>
                      </div>
                    );
                  }
                  
                  return (
                    <motion.div
                      key={key}
                      className={`relative rounded-xl overflow-hidden border ${imageColors[key as keyof typeof imageColors] || 'border-white/10'} bg-white/5 aspect-square group cursor-pointer`}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(124,58,237,0.15)' }}
                      transition={{ duration: 0.3 }}
                      onClick={() => openImage(imageUrl, imageLabels[key as keyof typeof imageLabels] || key)}
                    >
                      <img 
                        src={imageUrl}
                        alt={imageLabels[key as keyof typeof imageLabels] || key}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          console.error(`Failed to load image: ${imageUrl}`);
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.classList.add('flex', 'items-center', 'justify-center');
                            const fallback = document.createElement('span');
                            fallback.className = 'text-3xl';
                            fallback.textContent = '🖼️';
                            parent.prepend(fallback);
                            const text = document.createElement('p');
                            text.className = 'text-xs text-white/40 mt-1';
                            text.textContent = imageLabels[key as keyof typeof imageLabels] || key;
                            parent.appendChild(text);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <ZoomIn className="w-8 h-8 text-white/80" />
                          <span className="text-xs text-white/80 font-medium">Click to enlarge</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[10px] text-white/80">🔍 Click to zoom</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center aspect-square flex flex-col items-center justify-center">
                    <Loader size="sm" label="Loading..." />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Info */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Processed At</span>
            <span className="text-white/80 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              {formatDate(processedAt)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-white/40">Analysis Method</span>
            <span className="text-white/80">Deep Learning AI</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-white/40">Model Version</span>
            <span className="text-white/80">Retinexus v2.1</span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium">Analysis Complete</span>
          </div>
          <p className="text-xs text-white/40 mt-1">
            AI model successfully processed the retinal image with {images ? Object.keys(images).filter(k => images[k] && images[k] !== 'Failed').length : 0} output visualizations
          </p>
        </div>
      </motion.div>

      {/* ✅ SIMPLE LARGE IMAGE POPUP - Click to open, click to close */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImage}
          >
            <motion.div
              className="relative max-w-[90vw] max-h-[90vh]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Top Right */}
              <button
                className="absolute -top-4 -right-4 z-10 p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors duration-300 shadow-xl"
                onClick={closeImage}
              >
                <X className="w-6 h-6" />
              </button>

              {/* Image */}
              <div className="rounded-2xl overflow-hidden bg-[#0a0a1a] border border-white/10 shadow-2xl shadow-cyan-500/20">
                <img 
                  src={selectedImage}
                  alt={selectedLabel}
                  className="max-w-[90vw] max-h-[85vh] object-contain"
                />
                
                {/* Image Label - Bottom */}
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
    </>
  );
}