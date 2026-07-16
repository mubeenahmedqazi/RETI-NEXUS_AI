'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function DashboardClient({
  children,
  doctorId,
  doctorName,
}: {
  children: React.ReactNode;
  doctorId: string;
  doctorName: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] to-[#0a0a1a]">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        doctorId={doctorId}
        doctorName={doctorName}
      />
      
      <main className={`transition-all duration-300 ${
        isSidebarOpen ? 'ml-[240px]' : 'ml-[70px]'
      }`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}