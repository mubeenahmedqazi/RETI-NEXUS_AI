'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  Activity,
  LayoutDashboard,
  Upload,
  FileText,
  Settings,
  Users,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain,
  Eye,
  Scan,
  BarChart3,
  Calendar,
  MessageSquare,
  Heart,
  Shield,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [doctorName, setDoctorName] = useState('Doctor');

  // Fetch doctor info
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setDoctorName(data.name || 'Doctor');
        }
      } catch (error) {
        console.error('Failed to fetch doctor info:', error);
      }
    };
    fetchDoctorInfo();
  }, []);

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', color: 'from-cyan-400 to-sky-400' },
    { icon: Upload, label: 'Upload Scan', href: '/dashboard/upload', color: 'from-emerald-400 to-teal-400' },
    { icon: Users, label: 'Patients', href: '/dashboard/patients', color: 'from-green-400 to-emerald-400' },
    { icon: FolderOpen, label: 'View Reports', href: '/dashboard/reports', color: 'from-blue-400 to-indigo-400' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', color: 'from-violet-400 to-purple-400' },
    { icon: Calendar, label: 'Appointments', href: '/dashboard/appointments', color: 'from-rose-400 to-pink-400' },
    { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', color: 'from-amber-400 to-orange-400' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings', color: 'from-gray-400 to-slate-400' },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.aside
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-[#050816] to-[#0a0a1a] border-r border-white/5 z-50 overflow-hidden ${
        isOpen ? 'w-[240px]' : 'w-[70px]'
      }`}
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 20 }}
    >
      {/* Animated Background Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(0,212,255,0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(124,58,237,0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 80%, rgba(236,72,153,0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(0,212,255,0.03) 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* Logo Section */}
      <div className={`flex items-center justify-center py-4 px-2 border-b border-white/5 relative ${
        isOpen ? 'px-3' : 'px-2'
      }`}>
        <Link href="/dashboard" className="flex items-center justify-center">
          <motion.div 
            className="relative rounded-xl p-[2px] bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-600 shadow-lg shadow-cyan-500/10"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 30px rgba(0,212,255,.2)"
            }}
            transition={{ duration: 0.3 }}
          >
            <div 
              className="rounded-xl bg-gradient-to-br from-[#081320] via-[#0a1020] to-[#131533] flex items-center justify-center overflow-hidden"
              style={{
                width: isOpen ? '120px' : '44px',
                height: isOpen ? '120px' : '44px',
              }}
            >
              <Image
                src="/images/logo.png"
                alt="Retinexus AI"
                width={isOpen ? 100 : 34}
                height={isOpen ? 100 : 34}
                priority
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('span');
                    fallback.className = `font-bold text-cyan-400 ${isOpen ? 'text-4xl' : 'text-xl'}`;
                    fallback.textContent = 'R';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <div className="absolute inset-0 rounded-xl blur-xl bg-cyan-400/20 -z-10" />
          </motion.div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-2 py-3 space-y-0.5 relative h-[calc(100%-170px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <div className="space-y-0.5">
          {menuItems.map((item, index) => {
            const isActive = isActiveLink(item.href);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, type: 'spring' }}
                whileHover={{ x: 3 }}
              >
                <Link
                  href={item.href}
                  className="relative block"
                >
                  <motion.div
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                        : 'hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="relative"
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className={`absolute inset-0 rounded-lg blur-xl transition-opacity duration-300 ${
                        isActive ? 'opacity-100 bg-cyan-500/20' : 'opacity-0 group-hover:opacity-50'
                      }`} />
                      <item.icon className={`w-4 h-4 relative ${
                        isActive ? 'text-cyan-400' : 'text-white/40 group-hover:text-white'
                      } transition-colors duration-300`} />
                    </motion.div>
                    
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`text-sm font-medium ${
                          isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                        } transition-colors duration-300`}
                      >
                        {item.label}
                      </motion.span>
                    )}

                    {isActive && (
                      <motion.div 
                        className="absolute right-2 w-1 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-400"
                        layoutId="activeIndicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-400"
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section with Logout */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 border-t border-white/5 bg-gradient-to-t from-[#050816] to-transparent ${
        isOpen ? '' : 'flex justify-center'
      }`}>
        <div className="space-y-1.5 w-full">
          {isOpen ? (
            <>
              {/* Doctor Name */}
              <div className="px-3 py-1.5">
                <p className="text-xs text-white/40">Signed in as</p>
                <p className="text-sm text-white font-medium truncate">{doctorName}</p>
              </div>

              <motion.button 
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-300 text-white/60 hover:text-white group text-sm"
                whileHover={{ x: 3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard/settings')}
              >
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Settings</span>
              </motion.button>
              
              <motion.button 
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all duration-300 text-white/60 hover:text-red-400 group text-sm"
                whileHover={{ x: 3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform duration-300`} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </motion.button>
            </>
          ) : (
            <>
              {/* Avatar for collapsed sidebar */}
              <div className="flex justify-center mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {doctorName.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <motion.button 
                className="flex justify-center p-2 rounded-lg hover:bg-white/5 transition-all duration-300 text-white/40 hover:text-white w-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/dashboard/settings')}
              >
                <Settings className="w-4 h-4" />
              </motion.button>
              
              <motion.button 
                className="flex justify-center p-2 rounded-lg hover:bg-red-500/10 transition-all duration-300 text-white/40 hover:text-red-400 w-full"
                whileHover={{ scale: 1.1, rotate: 12 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}