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
  patientId?: string;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  processedAt?: string;
  approved?: boolean;
}

/** Formal clinical-lab header block: facility branding + patient demographics + order/imaging metadata. Renders on screen and print/PDF. */
export default function ClinicalReportHeader({
  reportId,
  patientId,
  patientName,
  patientAge,
  patientGender,
  processedAt,
  approved,
}: ClinicalReportHeaderProps) {
  const orderId = reportId ? reportId.slice(-10).toUpperCase() : 'PENDING';

  return (
    // Hidden on screen (kept out of the normal report view) but restored for print/PDF export.
    <div className="clinical-report-header surface rounded-2xl overflow-hidden hidden print:block">
      {/* Facility header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Logo size={46} animated={false} />
          <div>
            <p className="font-bold leading-tight" style={{ color: 'var(--foreground)' }}>RetiNexus AI Clinical Screening Center</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>AI-Assisted Diabetic Retinopathy Diagnostic Report</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {approved !== undefined && (
            <Badge tone={approved ? 'success' : 'warning'}>{approved ? 'Approved' : 'Pending Approval'}</Badge>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>Order ID</p>
            <p className="text-sm font-mono font-semibold" style={{ color: 'var(--foreground)' }}>{orderId}</p>
          </div>
        </div>
      </div>

      {/* Patient demographics + order/imaging metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 px-6 py-4">
        <Field label="Patient ID" value={patientId || 'N/A'} />
        <Field label="Patient Name" value={patientName || 'N/A'} />
        <Field label="Age" value={patientAge ?? 'N/A'} />
        <Field label="Gender" value={patientGender || 'N/A'} />
        <Field label="Referral / Scan Date" value={formatDate(processedAt)} />
        <Field label="Report Generated" value={formatDate(new Date().toISOString())} />
        <Field label="Imaging Modality" value="Digital Fundus Photography" />
        <Field label="Analysis Engine" value="RetiNexus AI Vision Pipeline" />
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
