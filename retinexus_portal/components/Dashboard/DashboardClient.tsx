'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function DashboardClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main
        className={`transition-all duration-300 ${isSidebarOpen ? 'ml-[240px]' : 'ml-[70px]'}`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
