'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Settings, Sparkles } from 'lucide-react';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Check if scrolled past 20px for glass effect
      setIsScrolled(currentScrollY > 20);
      
      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide header
        setIsVisible(false);
      } else {
        // Scrolling up - show header
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <motion.header
      className={`fixed top-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'glass py-2 border-b border-white/10' : 'py-3'
      }`}
      style={{ left: '280px' }}
      initial={{ y: 0 }}
      animate={{ 
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search patients, reports..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder:text-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50" 
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl hover:bg-white/5 transition-colors duration-300 relative">
            <Bell className="w-5 h-5 text-white/60 hover:text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <button className="p-2 rounded-xl hover:bg-white/5 transition-colors duration-300">
            <Settings className="w-5 h-5 text-white/60 hover:text-white" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 hover:border-cyan-500/50 transition-colors duration-300">
            
            <span className="text-sm text-white font-medium">AI Active</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}