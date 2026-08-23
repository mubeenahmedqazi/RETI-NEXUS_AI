'use client';

import Logo from './Logo';

function formatDate(value?: string) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface ClinicalReportHeaderProps {
  reportId?: string;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
}

/** Formal clinical-lab header block: facility branding + patient demographics. Renders on screen and print/PDF. */
export default function ClinicalReportHeader({
  reportId,
  patientName,
  patientAge,
  patientGender,
}: ClinicalReportHeaderProps) {
  return (
    // Hidden on screen (kept out of the normal report view) but restored for print/PDF export.
    // The logo sits free with no box around it — only the patient-details panel below it
    // gets a bordered card treatment.
    <div className="clinical-report-header hidden print:block">
      {/* Facility header — real brand lockup (icon + "RetiNexus AI" wordmark + tagline), matching the main logo */}
      <div className="flex items-center px-1 py-2">
        <Logo size={44} animated={false} withWordmark withTagline />
      </div>

      {/* Patient demographics — the only bordered element in the header. This block is
          print-only (never rendered on screen), so its sizing is set directly here rather
          than through print-specific CSS overrides. */}
      <div className="clinical-report-header-details rounded-xl overflow-hidden grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 px-4 py-3">
        <Field label="Patient Name" value={patientName || 'N/A'} />
        <Field label="Age" value={patientAge ?? 'N/A'} />
        <Field label="Gender" value={patientGender || 'N/A'} />
        <Field label="Report ID" value={reportId || 'N/A'} />
        <Field className="sm:col-span-2" label="Report Generated" value={formatDate(new Date().toISOString())} />
      </div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--subtle-foreground)' }}>{label}</p>
      <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--foreground)' }}>{value}</p>
    </div>
  );
}
