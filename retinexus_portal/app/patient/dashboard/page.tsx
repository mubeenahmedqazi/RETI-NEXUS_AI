'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

const GRADE_COLORS: Record<string, string> = {
  'No DR': '#10b981',
  'Mild NPDR': '#f59e0b',
  'Moderate NPDR': '#f97316',
  'Severe NPDR': '#ef4444',
  PDR: '#dc2626',
};

export default function PatientDashboard() {
  const router = useRouter();
  const [patientData, setPatientData] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setPatientData(data);

      const reportsResponse = await fetch('/api/patient/reports', { credentials: 'include' });
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const formattedDate = format(now, 'EEEE, MMMM d, yyyy');
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const gradeDistribution = ['No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'PDR']
    .map((grade) => ({ name: grade, value: reports.filter((r) => r.drGrade === grade).length, color: GRADE_COLORS[grade] }))
    .filter((g) => g.value > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl animate-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formattedDate}
        title={<>{greeting}, <span className="text-gradient-brand">{patientData?.name || 'Patient'}</span></>}
        description={<Badge tone="success" dot>System Online</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Total Reports" value={reports.length} icon={FileText} delay={0.05} iconTone="text-[var(--brand-secondary)] bg-[var(--brand-secondary)]/10" />
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-blue-500/10"><Calendar className="w-4 h-4 text-blue-500" /></div>
            <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Latest Report</span>
          </div>
          <p className="text-sm font-medium mt-3" style={{ color: 'var(--foreground)' }}>
            {reports.length > 0 ? format(new Date(reports[0].createdAt), 'MMM d, yyyy') : 'No reports'}
          </p>
        </div>
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10"><User className="w-4 h-4 text-emerald-500" /></div>
            <span className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Patient Name</span>
          </div>
          <p className="text-sm font-semibold mt-3 truncate" style={{ color: 'var(--foreground)' }}>{patientData?.name}</p>
        </div>
      </div>

      <div className="surface rounded-2xl p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--foreground)' }}>
          <Eye className="w-5 h-5 text-[var(--brand-secondary)]" />
          My DR Grade History
        </h3>

        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Share your CNIC with a doctor to get scanned." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-6 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                    {gradeDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {gradeDistribution.map((g, i) => (
                <motion.div key={g.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} /> {g.name}
                  </span>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{g.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
