'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Heart, Bean, Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { generateLongitudinalAnalysis } from '@/services/api';
import { LongitudinalAnalysis as LongitudinalAnalysisData, LongitudinalVisit } from '@/types/report';
import { riskLevel, toVisitSummary } from '@/lib/reportVisitSummary';
import { SectionLoader } from '@/components/ui/Loader';

const GRADE_INDEX: Record<string, number> = {
  'No DR': 0,
  'Mild NPDR': 1,
  'Moderate NPDR': 2,
  'Severe NPDR': 3,
  PDR: 4,
};
const GRADE_LABELS = ['No DR', 'Mild', 'Moderate', 'Severe', 'PDR'];

interface RawReport {
  id: string;
  drGrade: string;
  createdAt: string;
  reportData: any;
}

interface LongitudinalAnalysisProps {
  /** Reports for one patient, newest-first (matches the shape returned by /api/patients/[id]). */
  reports: RawReport[];
  /** Suppresses the trailing Recommendation block — for callers that render it themselves
   * elsewhere on the page (via onRecommendation below) instead of at the end of this card. */
  hideRecommendation?: boolean;
  /** Fires whenever the generated analysis's recommendation text changes (including to
   * null, on reset/regenerate) — lets a parent page render it in a different position. */
  onRecommendation?: (text: string | null) => void;
}

/** Doctor-facing panel comparing DR grade and organ-risk trend across a patient's visit
 * history, with an LLM-generated narrative. Renders nothing when fewer than 2 visits exist. */
export default function LongitudinalAnalysis({ reports, hideRecommendation = false, onRecommendation }: LongitudinalAnalysisProps) {
  const [analysis, setAnalysis] = useState<LongitudinalAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Oldest → newest, capped to the current visit + last 3 previous (4 visits total).
  const chronological = useMemo(() => [...reports].slice(0, 4).reverse(), [reports]);

  const chartData = useMemo(
    () =>
      chronological.map((r) => ({
        date: format(new Date(r.createdAt), 'MMM d'),
        grade: GRADE_INDEX[r.drGrade] ?? 0,
        gradeLabel: r.drGrade,
        cardiovascular: Math.round(riskLevel(r.reportData, 'Cardiovascular Risk') * 100),
        kidney: Math.round(riskLevel(r.reportData, 'Kidney Disease Risk') * 100),
        cerebrovascular: Math.round(riskLevel(r.reportData, 'Cerebrovascular Risk') * 100),
      })),
    [chronological]
  );

  const visitsPayload: LongitudinalVisit[] = useMemo(
    () => chronological.map((r) => toVisitSummary(r.reportData, r.createdAt)),
    [chronological]
  );

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateLongitudinalAnalysis(visitsPayload);
      setAnalysis(result);
    } catch (e: any) {
      setError(e.message || 'Failed to generate trend analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chronological.length >= 2) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports.map((r) => r.id).join(',')]);

  useEffect(() => {
    onRecommendation?.(analysis?.recommendation || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);

  if (chronological.length < 2) return null;

  const organRows = analysis
    ? [
        { key: 'heartTrend', label: 'Heart', icon: Heart, text: analysis.heartTrend },
        { key: 'kidneyTrend', label: 'Kidney', icon: Bean, text: analysis.kidneyTrend },
        { key: 'brainTrend', label: 'Brain', icon: Brain, text: analysis.brainTrend },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="surface rounded-2xl p-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Longitudinal Trend Analysis
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-40"
            title="Regenerate trend analysis"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--subtle-foreground)' }} />
          </button>
        </div>
      </div>
      <p className="text-xs mb-5" style={{ color: 'var(--subtle-foreground)' }}>
        Comparing this patient&apos;s last {chronological.length} visits — AI-generated, for physician review
      </p>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--subtle-foreground)' }}>
            DR Grade Progression
          </p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, 4]}
                  ticks={[0, 1, 2, 3, 4]}
                  tickFormatter={(v: number) => GRADE_LABELS[v] ?? String(v)}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  width={62}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }}
                  labelFormatter={(_, payload) => (payload && payload[0] ? payload[0].payload.gradeLabel : '')}
                  formatter={() => [null, null]}
                />
                <Line type="stepAfter" dataKey="grade" name="Grade" stroke="var(--brand-secondary)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--brand-secondary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--subtle-foreground)' }}>
            Systemic Risk Trend
          </p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--foreground)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" name="Heart" dataKey="cardiovascular" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" name="Kidney" dataKey="kidney" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" name="Brain" dataKey="cerebrovascular" stroke="var(--brand-accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LLM narrative */}
      {loading && <SectionLoader label="Analyzing visit history..." className="min-h-[160px]" />}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm rounded-xl p-4" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
          {error}
        </div>
      )}

      {!loading && !error && analysis && (
        <div className="space-y-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm leading-relaxed pl-4 border-l-2" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--brand-secondary)' }}>
            {analysis.summary}
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {organRows.map(
              (o) =>
                o.text && (
                  <div key={o.key} className="pl-4 border-l-2" style={{ borderColor: 'var(--brand-secondary)' }}>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                      <o.icon className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
                      {o.label}
                    </h4>
                    <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {o.text}
                    </p>
                  </div>
                )
            )}
          </div>

          {analysis.keyChanges.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'var(--muted)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--subtle-foreground)' }}>
                Key Changes
              </p>
              <ul className="space-y-1.5">
                {analysis.keyChanges.map((c, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--foreground)' }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--brand-secondary)' }} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hideRecommendation && analysis.recommendation && (
            <div
              className="rounded-xl p-4 border"
              style={{
                borderColor: 'color-mix(in srgb, var(--brand-accent) 30%, transparent)',
                background: 'color-mix(in srgb, var(--brand-accent) 6%, transparent)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--brand-accent)' }}>
                Recommendation
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                {analysis.recommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
