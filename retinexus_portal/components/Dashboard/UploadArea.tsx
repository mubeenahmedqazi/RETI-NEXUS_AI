'use client';

import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  Upload, Image, FileImage, Camera, CloudUpload,
  X, CheckCircle, AlertCircle,
} from 'lucide-react';
import Button from '../Common/Button';

interface UploadAreaProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  uploadedFile: File | null;
  onReset: () => void;
  /** True when this page was opened directly, without a patient selected via "New Scan". */
  disabled?: boolean;
}

export default function UploadArea({
  onUpload, isLoading, error, uploadedFile, onReset, disabled = false
}: UploadAreaProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files.length > 0 && onUpload(files[0]),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.tiff', '.tif', '.bmp'] },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    disabled: isLoading || disabled
  });

  return (
    <div className="surface rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15 rounded-xl">
          <Upload className="w-5 h-5 text-[var(--brand-secondary)]" />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Upload Fundus Image</h3>
          <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>JPEG, PNG, TIFF (Max 50MB)</p>
        </div>
      </div>

      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          style={{
            borderColor: isDragActive ? 'var(--brand-accent)' : 'var(--border)',
            background: isDragActive ? 'color-mix(in srgb, var(--brand-accent) 6%, transparent)' : 'transparent',
          }}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <motion.div animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--brand-secondary)]/10 to-[var(--brand-accent)]/10">
                {isDragActive ? (
                  <CloudUpload className="w-12 h-12 text-[var(--brand-accent)]" />
                ) : (
                  <Upload className="w-12 h-12 text-[var(--brand-secondary)]" />
                )}
              </div>
            </motion.div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {isDragActive ? 'Drop your image here' : 'Drag & drop your fundus image'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--subtle-foreground)' }}>
                or <span className="text-[var(--brand-secondary)] hover:underline">browse files</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs" style={{ color: 'var(--subtle-foreground)' }}>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'var(--muted)' }}>
                <FileImage className="w-3 h-3" /> JPEG
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'var(--muted)' }}>
                <Image className="w-3 h-3" /> PNG
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'var(--muted)' }}>
                <Camera className="w-3 h-3" /> TIFF
              </span>
            </div>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{uploadedFile.name}</p>
              <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={onReset} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-300" disabled={isLoading}>
              <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>
          <Button onClick={() => onUpload(uploadedFile)} variant="primary" fullWidth loading={isLoading} glow disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </Button>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-500">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
