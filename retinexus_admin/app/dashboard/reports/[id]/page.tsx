'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/Common/Button';
import { Swirling } from '@/components/ui/Swirling';
import AdminReportView from '@/components/Dashboard/AdminReportView';
import ConfirmDeleteModal from '@/components/Dashboard/ConfirmDeleteModal';
import { formatReportId } from '@/lib/reportId';
import type { ReportData } from '@/types/report';

interface ReportApiResponse {
  id: string;
  reportNumber: number;
  patientId: string;
  patientName: string;
  reportData: ReportData;
  createdAt: string;
  doctor: { id: string; name: string } | null;
}

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<ReportApiResponse | null>(null);
  const [patientAge, setPatientAge] = useState<number | undefined>(undefined);
  const [patientGender, setPatientGender] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/reports/${params.id}`);
        if (!response.ok) throw new Error('Report not found');
        const data = (await response.json()) as ReportApiResponse;
        setReport(data);

        // Age/gender aren't stored on the Report row itself — pull them from the
        // patient record so the printed header matches the portal's exactly.
        const patientRes = await fetch(`/api/patients/${data.patientId}`);
        if (patientRes.ok) {
          const patient = await patientRes.json();
          setPatientAge(patient.age ?? undefined);
          setPatientGender(patient.gender ?? undefined);
        }
      } catch {
        toast.error('Could not load this report');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading || !report) {
    return (
      <div className="surface rounded-2xl p-16 text-center">
        <Swirling className="w-8 h-8 mx-auto" style={{ color: 'var(--brand-secondary)' }} />
      </div>
    );
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/reports/${report.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || 'Failed to delete report');
      return;
    }
    toast.success(`Report ${formatReportId(report.reportNumber)} deleted`);
    router.push(`/dashboard/patients/${report.patientId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title={`Report ${formatReportId(report.reportNumber)}`}
        description={report.doctor ? `${report.patientName}, attending doctor ${report.doctor.name}` : report.patientName}
        actions={
          <>
            <Link href={`/dashboard/patients/${report.patientId}`}>
              <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Back to Patient</Button>
            </Link>
            <Button variant="ghost" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </>
        }
      />

      <AdminReportView
        report={report.reportData}
        reportId={formatReportId(report.reportNumber)}
        patientName={report.patientName}
        patientAge={patientAge}
        patientGender={patientGender}
      />

      {deleting && (
        <ConfirmDeleteModal
          title={`Delete Report ${formatReportId(report.reportNumber)}?`}
          description={`This permanently removes this screening report for ${report.patientName}. Reports with a linked detailed analysis can't be deleted until that record is removed first.`}
          onClose={() => setDeleting(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
