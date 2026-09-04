'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/Common/Button';
import { Swirling } from '@/components/ui/Swirling';
import ConfirmDeleteModal from '@/components/Dashboard/ConfirmDeleteModal';
import AdminDetailedAnalysisView from '@/components/Dashboard/AdminDetailedAnalysisView';
import { formatAnalysisId, formatReportId } from '@/lib/reportId';
import type { ReportData } from '@/types/report';

interface AnalysisApiResponse {
  id: string;
  reportCode: string | null;
  patientId: string;
  testName: string;
  clinicalSummary: string;
  testFindings: string;
  organFindings: { heart?: string; kidney?: string; brain?: string };
  redFlags: string[];
  recommendations: string[];
  urgency: string;
  extractionMethod: string | null;
  createdAt: string;
  doctor: { id: string; name: string } | null;
  report: { id: string; reportNumber: number; reportCode: string | null; reportData: ReportData } | null;
}

export default function DetailedAnalysisDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisApiResponse | null>(null);
  const [patientName, setPatientName] = useState<string | undefined>(undefined);
  const [patientAge, setPatientAge] = useState<number | undefined>(undefined);
  const [patientGender, setPatientGender] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/detailed-analyses/${params.id}`);
        if (!response.ok) throw new Error('Not found');
        const data = (await response.json()) as AnalysisApiResponse;
        setAnalysis(data);

        const patientRes = await fetch(`/api/patients/${data.patientId}`);
        if (patientRes.ok) {
          const patient = await patientRes.json();
          setPatientName(patient.name ?? undefined);
          setPatientAge(patient.age ?? undefined);
          setPatientGender(patient.gender ?? undefined);
        }
      } catch {
        toast.error('Could not load this analysis');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading || !analysis) {
    return (
      <div className="surface rounded-2xl p-16 text-center">
        <Swirling className="w-8 h-8 mx-auto" style={{ color: 'var(--brand-secondary)' }} />
      </div>
    );
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/detailed-analyses/${analysis.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || 'Failed to delete detailed analysis');
      return;
    }
    toast.success(`${analysis.testName} deleted`);
    router.push(`/dashboard/patients/${analysis.patientId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title={analysis.testName}
        description={
          analysis.report
            ? `${patientName || ''}, linked to Screening Report ${formatReportId(analysis.report)}`.replace(/^, /, '')
            : patientName
        }
        actions={
          <>
            <Link href={`/dashboard/patients/${analysis.patientId}`}>
              <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Back to Patient</Button>
            </Link>
            <Button variant="ghost" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </>
        }
      />

      <AdminDetailedAnalysisView
        result={{
          clinicalSummary: analysis.clinicalSummary,
          testFindings: analysis.testFindings,
          organFindings: analysis.organFindings,
          redFlags: analysis.redFlags,
          recommendations: analysis.recommendations,
          urgency: analysis.urgency,
          extractionMethod: analysis.extractionMethod,
        }}
        testName={analysis.testName}
        analyzedAt={analysis.createdAt}
        reportIdLabel={formatAnalysisId(analysis)}
        patientName={patientName}
        patientAge={patientAge}
        patientGender={patientGender}
        screeningReport={analysis.report?.reportData}
      />

      {deleting && (
        <ConfirmDeleteModal
          title={`Delete ${analysis.testName}?`}
          description="This permanently removes this detailed analysis record."
          onClose={() => setDeleting(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
