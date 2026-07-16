'use client';

import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { 
  Upload, Image, FileImage, Camera, CloudUpload, 
  X, CheckCircle, AlertCircle, Sparkles 
} from 'lucide-react';
import Button from '../Common/Button';

interface UploadAreaProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  uploadedFile: File | null;
  onReset: () => void;
}

export default function UploadArea({ 
  onUpload, isLoading, error, uploadedFile, onReset 
}: UploadAreaProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files.length > 0 && onUpload(files[0]),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.tiff', '.tif', '.bmp'] },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    disabled: isLoading
  });

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-indigo-600/20 rounded-xl">
          <Upload className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Upload Fundus Image</h3>
          <p className="text-xs text-white/40">JPEG, PNG, TIFF (Max 50MB)</p>
        </div>
      </div>

      {!uploadedFile ? (
        <div {...getRootProps()} className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-cyan-400 bg-cyan-400/5 shadow-lg shadow-cyan-400/20' 
            : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
        }`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <motion.div animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-indigo-600/10">
                {isDragActive ? (
                  <CloudUpload className="w-12 h-12 text-cyan-400" />
                ) : (
                  <Upload className="w-12 h-12 text-cyan-400" />
                )}
              </div>
            </motion.div>
            <div>
              <p className="text-sm font-medium text-white">
                {isDragActive ? 'Drop your image here' : 'Drag & drop your fundus image'}
              </p>
              <p className="text-xs text-white/30 mt-1">
                or <span className="text-cyan-400 hover:underline">browse files</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/20">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <FileImage className="w-3 h-3" /> JPEG
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Image className="w-3 h-3" /> PNG
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Camera className="w-3 h-3" /> TIFF
              </span>
            </div>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{uploadedFile.name}</p>
              <p className="text-xs text-white/40">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={onReset} className="p-2 rounded-lg hover:bg-white/5 transition-colors duration-300" disabled={isLoading}>
              <X className="w-4 h-4 text-white/40 hover:text-white" />
            </button>
          </div>
          <Button onClick={() => onUpload(uploadedFile)} variant="primary"  fullWidth loading={isLoading} glow disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </Button>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  );
}