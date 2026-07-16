'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn, User, Stethoscope, UserCircle, Phone } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [role, setRole] = useState<'doctor' | 'patient'>('doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: role
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        if (data.role === 'DOCTOR') {
          sessionStorage.setItem('userId', data.userId);
          sessionStorage.setItem('userName', data.name);
          sessionStorage.setItem('userRole', data.role);
          router.push('/dashboard');
        } else if (data.role === 'PATIENT') {
          sessionStorage.setItem('userId', data.userId);
          sessionStorage.setItem('userName', data.name);
          sessionStorage.setItem('userRole', data.role);
          sessionStorage.setItem('patientCnic', data.cnic);
          router.push('/patient/dashboard');
        }
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0a0a1a] to-[#131533] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-gradient-to-b from-[#0a0e1a] to-[#050816] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-cyan-500/5">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="inline-block"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 p-0.5">
                <div className="w-full h-full rounded-2xl bg-[#050816] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/images/logo.png"
                    alt="Retinexus AI Logo"
                    width={60}
                    height={60}
                    className="object-contain"
                    priority
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallback = document.createElement('span');
                        fallback.className = 'text-3xl font-bold text-cyan-400';
                        fallback.textContent = 'R';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mt-4">
              Welcome Back
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Sign in to your Retinexus AI account
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300 ${
                  role === 'doctor'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span className="text-sm font-medium">Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300 ${
                  role === 'patient'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-400'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <UserCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Patient</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                {role === 'doctor' ? 'Email Address' : 'CNIC or Phone Number'} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                {role === 'doctor' ? (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                ) : (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                )}
                <input
                  type={role === 'doctor' ? 'email' : 'text'}
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={role === 'doctor' ? 'doctor@hospital.com' : '12345-1234567-1 or 0300-1234567'}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-10 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/40 hover:text-white/60 cursor-pointer">
                <input type="checkbox" className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium py-2.5 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In as {role === 'doctor' ? 'Doctor' : 'Patient'}
                </>
              )}
            </motion.button>
          </form>

          {/* ✅ Sign Up Links - Fixed with direct link */}
          <div className="mt-6 text-center text-sm text-white/40">
            {role === 'doctor' ? (
              <>
                Don't have an account?{' '}
                <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Sign up now
                </Link>
              </>
            ) : (
              <>
                Don't have patient access?{' '}
                <Link 
                  href="/patient-register" 
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Register as Patient
                </Link>
              </>
            )}
          </div>

          {/* Role Indicator */}
          <div className="mt-4 text-center">
            <span className="text-xs text-white/20">
              {role === 'doctor' ? '🔬 Doctor Login' : '👤 Patient Login'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}