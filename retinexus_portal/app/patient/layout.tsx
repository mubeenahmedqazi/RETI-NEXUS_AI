'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import PatientSidebar from '@/components/Patient/PatientSidebar';
import Footer from '@/components/Common/Footer';
import { FullScreenLoader } from '@/components/ui/Loader';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Check if this is the register page FIRST
  const isRegisterPage = pathname === '/patient/register';

  useEffect(() => {
    // ✅ If register page, don't check auth
    if (isRegisterPage) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (!response.ok) {
          router.push('/login?redirect=' + encodeURIComponent(pathname || '/patient/dashboard'));
        } else {
          const data = await response.json();
          if (data.role !== 'PATIENT') {
            router.push('/login?redirect=' + encodeURIComponent(pathname || '/patient/dashboard'));
          }
        }
      } catch (error) {
        router.push('/login?redirect=' + encodeURIComponent(pathname || '/patient/dashboard'));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, isRegisterPage]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Show loading state
  if (isLoading) {
    return <FullScreenLoader label="Loading your workspace..." />;
  }

  // Register page renders without the authenticated sidebar shell
  if (isRegisterPage) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Mobile Menu Button */}
      <AnimatePresence>
        {isMobile && !isSidebarOpen && (
          <motion.button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-3 rounded-xl surface backdrop-blur-xl lg:hidden"
            style={{ color: 'var(--foreground)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-50">
        <PatientSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen && !isMobile ? 'lg:ml-[240px]' : isMobile ? 'ml-0' : 'lg:ml-[70px]'
        }`}
      >
        <motion.div
          className="flex-1 p-4 md:p-6 lg:p-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </motion.div>
        <Footer />
      </main>
    </div>
  );
}