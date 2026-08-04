'use client';

import Logo from './Logo';
import Badge from './Badge';

function formatDate(value?: string) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface ClinicalReportHeaderProps {
  reportId?: string;
  patientCnic?: string;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  processedAt?: string;
  approved?: boolean;
}

/** Formal clinical-lab header block: facility branding + patient demographics. Renders on screen and print/PDF. */
export default function ClinicalReportHeader({
  patientCnic,
  patientName,
  patientAge,
  patientGender,
  processedAt,
  approved,
}: ClinicalReportHeaderProps) {
  return (
    // Hidden on screen (kept out of the normal report view) but restored for print/PDF export.
    <div className="clinical-report-header surface rounded-2xl overflow-hidden hidden print:block">
      {/* Facility header — real brand lockup (icon + "RetiNexus AI" wordmark) */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Logo size={48} animated={false} withWordmark />
        <div className="flex items-center gap-4">
          {approved !== undefined && (
            <Badge tone={approved ? 'success' : 'warning'}>{approved ? 'Approved' : 'Pending Approval'}</Badge>
          )}
        </div>
      </div>

      {/* Patient demographics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 px-6 py-4">
        <Field label="Patient CNIC" value={patientCnic || 'N/A'} />
        <Field label="Patient Name" value={patientName || 'N/A'} />
        <Field label="Age" value={patientAge ?? 'N/A'} />
        <Field label="Gender" value={patientGender || 'N/A'} />
        <Field label="Referral / Scan Date" value={formatDate(processedAt)} />
        <Field label="Report Generated" value={formatDate(new Date().toISOString())} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--subtle-foreground)' }}>{label}</p>
      <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--foreground)' }}>{value}</p>
    </div>
  );
}
