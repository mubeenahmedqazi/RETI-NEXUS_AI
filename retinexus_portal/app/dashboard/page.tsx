'use client';

import { useState, useEffect } from 'react';
import {
  Users, FileText, Eye, TrendingUp,
  Hospital, Stethoscope, ScanEye,
} from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getReports, getPatients } from '@/services/api';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

const GRADE_COLORS: Record<string, string> = {
  'No DR': '#10b981',
  'Mild NPDR': '#f59e0b',
  'Moderate NPDR': '#f97316',
  'Severe NPDR': '#ef4444',
  PDR: '#dc2626',
};

export default function DashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState({
    name: 'Doctor',
    hospital: 'Not specified',
    specialization: 'General',
  });

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setDoctorData({
          name: data.name || 'Doctor',
          hospital: data.hospital || 'Not specified',
          specialization: data.specialization || 'General',
        });
        await loadData();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to load doctor data:', error);
    }
  };

  const loadData = async () => {
    try {
      const [reportsData, patientsData] = await Promise.all([getReports(), getPatients()]);
      setReports(reportsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const formattedDate = format(now, 'EEEE, MMMM d, yyyy');
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const totalPatients = patients.length;
  const totalReports = reports.length;
  const normalCount = reports.filter((r) => r.drGrade === 'No DR').length;
  const abnormalCount = totalReports - normalCount;

  const gradeDistribution = ['No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'PDR']
    .map((grade) => ({ name: grade, value: reports.filter((r) => r.drGrade === grade).length, color: GRADE_COLORS[grade] }))
    .filter((g) => g.value > 0);

  // last 7 report-days trend (by createdAt/approvedAt date bucket)
  const trendMap = new Map<string, number>();
  reports.forEach((r) => {
    const d = r.approvedAt || r.createdAt;
    if (!d) return;
    const key = format(new Date(d), 'MMM d');
    trendMap.set(key, (trendMap.get(key) || 0) + 1);
  });
  const trendData = Array.from(trendMap.entries()).slice(-7).map(([date, count]) => ({ date, count }));

  // Last 6 calendar months' report volume — a longer-term complement to the 7-day
  // activity trend above, grouped by month rather than by day.
  const monthlyMap = new Map<string, number>();
  reports.forEach((r) => {
    const d = r.approvedAt || r.createdAt;
    if (!d) return;
    const key = format(new Date(d), 'MMM yyyy');
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  });
  const monthlyData = Array.from(monthlyMap.entries())
    .sort((a, b) => new Date(`1 ${a[0]}`).getTime() - new Date(`1 ${b[0]}`).getTime())
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl animate-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formattedDate}
        title={<>{greeting}, <span className="text-gradient-brand">Dr. {doctorData.name}</span></>}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> {doctorData.specialization}</span>
            <span className="flex items-center gap-1.5"><Hospital className="w-3.5 h-3.5" /> {doctorData.hospital}</span>
            <Badge tone="success" dot>System Online</Badge>
          </span>
        }
        actions={
          <button
            onClick={() => router.push('/dashboard/patients/analysis')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-accent)] text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 whitespace-nowrap"
          >
            <ScanEye className="w-4 h-4" />
            New Retinal Scan
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Patients" value={totalPatients} icon={Users} delay={0.05} iconTone="text-[var(--brand-secondary)] bg-[var(--brand-secondary)]/10" />
        <MetricCard label="Total Reports" value={totalReports} icon={FileText} delay={0.1} iconTone="text-[var(--brand-accent)] bg-[var(--brand-accent)]/10" />
        <MetricCard label="Normal Findings" value={normalCount} icon={TrendingUp} delay={0.15} iconTone="text-emerald-500 bg-emerald-500/10" />
        <MetricCard label="Flagged Cases" value={abnormalCount} icon={Eye} delay={0.2} iconTone="text-amber-500 bg-amber-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* DR Grade distribution donut */}
        <div className="lg:col-span-2 surface rounded-2xl p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Eye className="w-5 h-5 text-[var(--brand-secondary)]" />
            DR Grade Distribution
          </h3>
          {reports.length === 0 ? (
            <div className="py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>
              <p>No reports yet</p>
              <button onClick={() => router.push('/dashboard/upload')} className="mt-2 text-[var(--brand-secondary)] hover:underline text-sm">
                Upload your first scan →
              </button>
            </div>
          ) : (
            <>
              <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gradeDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                      {gradeDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {gradeDistribution.map((g) => (
                  <div key={g.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                    <span style={{ color: 'var(--muted-foreground)' }}>{g.name}</span>
                    <span className="ml-auto font-medium" style={{ color: 'var(--foreground)' }}>{g.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Screening trend */}
        <div className="lg:col-span-3 surface rounded-2xl p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <TrendingUp className="w-5 h-5 text-[var(--brand-accent)]" />
            Recent Screening Activity
          </h3>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }} />
                <Area type="monotone" dataKey="count" stroke="var(--brand-accent)" strokeWidth={2.5} fill="url(#trendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly volume — longer-term complement to the 7-day trend above */}
      <div className="surface rounded-2xl p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <FileText className="w-5 h-5 text-[var(--brand-secondary)]" />
          Monthly Screening Volume
        </h3>
        {monthlyData.length === 0 ? (
          <div className="py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>
            <p>No reports yet</p>
          </div>
        ) : (
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="count" fill="var(--brand-secondary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
