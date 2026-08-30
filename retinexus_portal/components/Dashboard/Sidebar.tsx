'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Upload,
  Users,
  UserPlus,
  SearchCheck,
  FolderOpen,
  Stethoscope,
  TrendingUp,
  FileStack,
  ChevronDown,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavChild {
  icon: LucideIcon;
  label: string;
  href: string;
}

// Connector-line color for dropdown groups — a dark, clearly visible gray (not pure black).
const CONNECTOR_COLOR = '#4b5563';

const topItems: NavChild[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Upload, label: 'Upload Scan', href: '/dashboard/upload' },
];

// "Patients" is a dropdown, expanding into these three dedicated pages.
const patientsChildren: NavChild[] = [
  { icon: UserPlus, label: 'Add Patient', href: '/dashboard/patients/add' },
  { icon: Users, label: 'Your Patients', href: '/dashboard/patients' },
  { icon: SearchCheck, label: 'Patient Analysis', href: '/dashboard/patients/analysis' },
];

// "Reports" is a dropdown, not a direct link — it expands into these, connected by a
// vertical line, rather than each living as its own flat top-level item.
const reportsChildren: NavChild[] = [
  { icon: FolderOpen, label: 'Screening Reports', href: '/dashboard/reports' },
  { icon: Stethoscope, label: 'Detailed Analysis', href: '/dashboard/detailed-analyses' },
];

// Standalone — lives outside the Reports dropdown, not as one of its sub-items.
const longitudinalHistoryItem: NavChild = { icon: TrendingUp, label: 'Patient Longitudinal History', href: '/dashboard/longitudinal-history' };

/** A single flat nav row (used for both top-level items and standalone items). */
function NavRow({ item, isActive, isSidebarOpen, delay }: { item: NavChild; isActive: boolean; isSidebarOpen: boolean; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, type: 'spring' }} whileHover={{ x: 3 }}>
      <Link href={item.href} className="relative block">
        <motion.div
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 cursor-pointer group ${
            isActive
              ? 'bg-gradient-to-r from-[var(--brand-secondary)]/12 to-[var(--brand-accent)]/12 border'
              : 'hover:bg-[var(--muted)] border border-transparent'
          }`}
          style={isActive ? { borderColor: 'var(--brand-accent)', opacity: 1 } : undefined}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <item.icon className="w-4 h-4 flex-shrink-0 transition-colors duration-300" style={{ color: isActive ? 'var(--brand-accent)' : 'var(--muted-foreground)' }} />
          {isSidebarOpen && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} className="text-sm font-medium" style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
              {item.label}
            </motion.span>
          )}
          {isActive && (
            <motion.div
              className="absolute right-2 w-1 h-6 rounded-full bg-gradient-to-b from-[var(--brand-secondary)] to-[var(--brand-accent)]"
              layoutId="activeIndicator"
              transition={{ type: 'spring', stiffness: 300 }}
            />
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

/** An expandable group: a parent button that toggles a set of children, connected to it
 * by a single vertical trunk line that branches into a rounded elbow at each child. */
function NavDropdown({
  icon: Icon,
  label,
  fallbackHref,
  children,
  expanded,
  onToggle,
  isSidebarOpen,
  isActiveLink,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  fallbackHref: string;
  children: NavChild[];
  expanded: boolean;
  onToggle: () => void;
  isSidebarOpen: boolean;
  isActiveLink: (href: string) => boolean;
  delay: number;
}) {
  const router = useRouter();
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, type: 'spring' }}>
      <motion.button
        type="button"
        onClick={() => (isSidebarOpen ? onToggle() : router.push(fallbackHref))}
        className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 cursor-pointer group hover:bg-[var(--muted)] border border-transparent"
        whileHover={{ scale: 1.02, x: 3 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
        {isSidebarOpen && (
          <>
            <span className="text-sm font-medium flex-1 text-left" style={{ color: 'var(--muted-foreground)' }}>
              {label}
            </span>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
            </motion.span>
          </>
        )}
      </motion.button>

      {isSidebarOpen && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="relative ml-[19px] pl-4 overflow-hidden"
        >
          {/* Trunk stub bridging from the parent row down into the first branch, so the
              line visibly originates at the dropdown button rather than floating below it. */}
          <span className="absolute -left-4 -top-1 h-1 w-0" style={{ borderLeft: `2px solid ${CONNECTOR_COLOR}` }} />
          {children.map((item, index) => {
            const isActive = isActiveLink(item.href);
            const isLast = index === children.length - 1;
            return (
              <Link key={item.href} href={item.href} className="relative block">
                {/* One rounded elbow per item — vertical stub from this row's top down to its
                    middle, then curving right into the item. */}
                <span
                  className="absolute -left-4 top-0 bottom-1/2 w-4 rounded-bl-lg"
                  style={{ borderLeft: `2px solid ${CONNECTOR_COLOR}`, borderBottom: `2px solid ${CONNECTOR_COLOR}` }}
                />
                {/* Continues the trunk from this item's middle down to the next item's top, so
                    consecutive elbows read as one single connected line, not separate segments
                    — omitted on the last item so the trunk doesn't dangle past it. */}
                {!isLast && <span className="absolute -left-4 top-1/2 bottom-0" style={{ borderLeft: `2px solid ${CONNECTOR_COLOR}` }} />}
                <motion.div
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--brand-secondary)]/12 to-[var(--brand-accent)]/12 border'
                      : 'hover:bg-[var(--muted)] border border-transparent'
                  }`}
                  style={isActive ? { borderColor: 'var(--brand-accent)', opacity: 1 } : undefined}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Leading status dot — replaces a per-item icon for sub-rows, matching the
                      "dot indicator + label" nested-list structure. */}
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300"
                    style={{ background: isActive ? 'var(--brand-accent)' : 'var(--muted-foreground)' }}
                  />
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="text-sm font-medium"
                    style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [patientsOpen, setPatientsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  // Auto-expand a dropdown when landing directly on one of its sub-pages (e.g. a deep
  // link or page refresh), so the active item isn't hidden inside a collapsed group.
  useEffect(() => {
    if (pathname?.startsWith('/dashboard/patients')) setPatientsOpen(true);
    if (reportsChildren.some((c) => pathname?.startsWith(c.href))) setReportsOpen(true);
  }, [pathname]);

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
    const [path] = href.split('?');
    // Exact-match these two — otherwise, since pathname.startsWith() is a prefix check,
    // "Your Patients" (/dashboard/patients) would also read as active while actually on
    // /dashboard/patients/add or /dashboard/patients/analysis.
    if (path === '/dashboard' || path === '/dashboard/patients') return pathname === path;
    return pathname?.startsWith(path);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.aside
      className={`fixed left-0 top-0 h-full z-50 overflow-hidden border-r rounded-r-[22px]`}
      style={{
        width: isOpen ? 240 : 70,
        background: 'var(--sidebar-bg)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      }}
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100, damping: 20 }}
    >
      {/* Logo Section — eye on the left, wordmark/tagline on the right, one rounded cyan frame */}
      <div className="flex items-center justify-center py-5 border-b relative" style={{ borderColor: 'var(--border)' }}>
        <Link href="/dashboard" className="flex items-center justify-center">
          <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.3 }}>
            {isOpen ? (
              <Logo size={48} withWordmark withTagline />
            ) : (
              <Logo size={44} />
            )}
          </motion.div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1 relative h-[calc(100%-236px)] overflow-y-auto scrollbar-thin">
        {topItems.map((item, index) => (
          <NavRow key={item.href} item={item} isActive={isActiveLink(item.href)} isSidebarOpen={isOpen} delay={index * 0.05} />
        ))}

        {/* Patients — dropdown: all three sub-items land on /dashboard/patients, which
            already has the add-patient modal and search+scan flow built in. */}
        <NavDropdown
          icon={Users}
          label="Patients"
          fallbackHref="/dashboard/patients"
          children={patientsChildren}
          expanded={patientsOpen}
          onToggle={() => setPatientsOpen((v) => !v)}
          isSidebarOpen={isOpen}
          isActiveLink={isActiveLink}
          delay={topItems.length * 0.05}
        />

        {/* Reports — dropdown, not a direct link: click expands two sub-items connected by
            a vertical line, instead of "Screening Reports" and "Detailed Analysis" each
            living as their own flat top-level item. */}
        <NavDropdown
          icon={FileStack}
          label="Reports"
          fallbackHref="/dashboard/reports"
          children={reportsChildren}
          expanded={reportsOpen}
          onToggle={() => setReportsOpen((v) => !v)}
          isSidebarOpen={isOpen}
          isActiveLink={isActiveLink}
          delay={(topItems.length + 1) * 0.05}
        />

        {/* Standalone — lives outside the Reports dropdown, not one of its sub-items. */}
        <NavRow
          item={longitudinalHistoryItem}
          isActive={isActiveLink(longitudinalHistoryItem.href)}
          isSidebarOpen={isOpen}
          delay={(topItems.length + 2) * 0.05}
        />
      </nav>

      {/* Bottom Section */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isOpen ? '' : 'flex flex-col items-center'}`}
        style={{ borderColor: 'var(--border)' }}
      >
        {isOpen ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 py-1">
              <div className="min-w-0">
                <p className="text-[11px]" style={{ color: 'var(--subtle-foreground)' }}>Signed in as</p>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{doctorName}</p>
              </div>
              <ThemeToggle />
            </div>

            <button
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl hover:bg-[var(--muted)] transition-all duration-300 text-sm group"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>Profile</span>
            </button>

            <button
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl hover:bg-red-500/10 transition-all duration-300 text-sm text-[var(--muted-foreground)] hover:text-red-500 group"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform duration-300`} />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] flex items-center justify-center text-white text-xs font-bold">
              {doctorName.charAt(0).toUpperCase()}
            </div>
            <button
              className="flex justify-center p-2 rounded-xl hover:bg-[var(--muted)] transition-all duration-300 w-full"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              className="flex justify-center p-2 rounded-xl hover:bg-red-500/10 transition-all duration-300 text-[var(--muted-foreground)] hover:text-red-500 w-full"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
