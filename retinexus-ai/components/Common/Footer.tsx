'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-[#0a0a1a]/50 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <motion.p 
            className="text-sm text-white/30"
            whileHover={{ scale: 1.02 }}
          >
            © {currentYear} Retinexus AI. All Rights Reserved.
          </motion.p>
          <div className="flex items-center gap-4 text-xs text-white/20">
            <Link href="#privacy" className="hover:text-white/40 transition-colors duration-300">
              Privacy
            </Link>
            <Link href="#terms" className="hover:text-white/40 transition-colors duration-300">
              Terms
            </Link>
            <Link href="#cookies" className="hover:text-white/40 transition-colors duration-300">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}