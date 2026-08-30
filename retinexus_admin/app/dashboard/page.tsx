import { Stethoscope, Users, Clock, ShieldOff, BarChart3 } from 'lucide-react';
import prisma from '@/lib/db';
import PageHeader from '@/components/ui/PageHeader';
import PatientsPerDoctorChart from '@/components/Dashboard/PatientsPerDoctorChart';

// Must query fresh on every request — without this Next statically renders the counts
// once at build time and serves that same frozen snapshot forever.
export const dynamic = 'force-dynamic';

async function getStats() {
  const [totalDoctors, totalPatients, pending, blocked] = await Promise.all([
    prisma.user.count({ where: { role: 'DOCTOR' } }),
    prisma.patient.count(),
    prisma.user.count({ where: { role: 'DOCTOR', status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'DOCTOR', status: 'BLOCKED' } }),
  ]);
  return { totalDoctors, totalPatients, pending, blocked };
}

async function getPatientsPerDoctor() {
  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    select: { name: true, _count: { select: { patients: true } } },
    orderBy: { patients: { _count: 'desc' } },
    take: 8,
  });
  return doctors
    .filter((d) => d._count.patients > 0)
    .map((d) => ({ name: d.name.length > 14 ? `${d.name.slice(0, 13)}…` : d.name, patients: d._count.patients }));
}

export default async function OverviewPage() {
  const [stats, patientsPerDoctor] = await Promise.all([getStats(), getPatientsPerDoctor()]);

  const cards = [
    { label: 'Total Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'var(--brand-secondary)' },
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'var(--brand-accent)' },
    { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'var(--brand-warning)' },
    { label: 'Blocked Accounts', value: stats.blocked, icon: ShieldOff, color: 'var(--brand-danger)' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title="Overview"
        description="Platform-wide doctor and patient activity"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="surface rounded-2xl p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `color-mix(in srgb, ${card.color} 15%, transparent)` }}
            >
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{card.value}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{card.label}</p>
          </div>
        ))}
      </div>

      {stats.pending > 0 && (
        <div className="surface rounded-2xl p-5 border-l-4" style={{ borderLeftColor: 'var(--brand-warning)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {stats.pending} doctor{stats.pending === 1 ? ' account is' : ' accounts are'} waiting on approval.
          </p>
          <a href="/dashboard/doctors?status=PENDING" className="text-sm text-[var(--brand-secondary)] hover:underline mt-1 inline-block">
            Review pending doctors &rarr;
          </a>
        </div>
      )}

      <div className="surface rounded-2xl p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <BarChart3 className="w-5 h-5 text-[var(--brand-secondary)]" />
          Patients per Doctor
        </h3>
        {patientsPerDoctor.length === 0 ? (
          <div className="py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>
            <p>No patients registered yet</p>
          </div>
        ) : (
          <div className="h-72 mt-2">
            <PatientsPerDoctorChart data={patientsPerDoctor} />
          </div>
        )}
      </div>
    </div>
  );
}
