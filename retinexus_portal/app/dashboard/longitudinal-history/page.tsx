'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, TrendingUp, TrendingDown, AlertTriangle,
  Activity, ShieldAlert, ArrowLeft, Sparkles,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/Common/Button';
import { Swirling } from '@/components/ui/Swirling';
import { findPatientsByPhone, runLongitudinalHistoryAnalysis, MatchedPatient, LongitudinalInsights } from '@/services/api';

type Stage = 'search' | 'pick' | 'loading' | 'results';

export default function LongitudinalHistoryPage() {
  const [stage, setStage] = useState<Stage>('search');
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<MatchedPatient[]>([]);
  const [selected, setSelected] = useState<MatchedPatient | null>(null);
  const [insights, setInsights] = useState<LongitudinalInsights | null>(null);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setSearching(true);
    setError('');
    try {
      const patients = await findPatientsByPhone(phone.trim());
      if (patients.length === 1) {
        setSelected(patients[0]);
        await runAnalysis(patients[0]);
      } else {
        setMatches(patients);
        setStage('pick');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No patient account found for that phone number.');
    } finally {
      setSearching(false);
    }
  };

  const runAnalysis = async (patient: MatchedPatient) => {
    setSelected(patient);
    setStage('loading');
    try {
      const result = await runLongitudinalHistoryAnalysis(patient.phone, patient.id);
      setInsights(result);
      setStage('results');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to run longitudinal analysis.');
      setStage('search');
    }
  };

  const reset = () => {
    setStage('search');
    setPhone('');
    setMatches([]);
    setSelected(null);
    setInsights(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinical Records"
        title="Patient Longitudinal History"
        description="Enter a phone number to run an AI trend analysis across a patient's last 3 reports"
        actions={
          stage !== 'search' ? (
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={reset}>
              New Search
            </Button>
          ) : undefined
        }
      />

      <AnimatePresence mode="wait">
        {stage === 'search' && (
          <motion.div key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="surface rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--subtle-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search by patient phone number..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-transparent border rounded-xl pl-10 pr-4 py-2.5 ring-focus outline-none transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <Button variant="primary" glow icon={searching ? <Swirling className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />} onClick={handleSearch} disabled={searching || !phone.trim()}>
                {searching ? 'Searching...' : 'Find Account'}
              </Button>
            </div>
            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/25 text-red-500">
                {error}
              </motion.p>
            )}
          </motion.div>
        )}

        {stage === 'pick' && (
          <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {matches.length} accounts match that phone number — select the one to analyze:
            </p>
            {matches.map((p) => (
              <button
                key={p.id}
                onClick={() => runAnalysis(p)}
                className="w-full flex items-center gap-3 surface rounded-2xl p-4 hover:shadow-lg hover:border-[var(--brand-accent)]/40 transition-all duration-300 text-left"
              >
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
                  <User className="w-5 h-5 text-[var(--brand-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{p.name}</p>
                  <p className="text-sm" style={{ color: 'var(--subtle-foreground)' }}>
                    {p.phone} {p.age ? `• ${p.age} yrs` : ''} {p.gender ? `• ${p.gender}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {stage === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="surface rounded-2xl p-16 text-center">
            <Swirling className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--brand-secondary)' }} />
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Analyzing {selected?.name}&apos;s report history...</p>
            <p className="text-sm mt-1" style={{ color: 'var(--subtle-foreground)' }}>
              Extraction &rarr; Clinical Reasoning &rarr; Validation — this can take a few minutes, longer if it needs to retry a busy AI provider.
            </p>
          </motion.div>
        )}

        {stage === 'results' && insights && selected && (
          <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="surface rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--brand-secondary)]/15 to-[var(--brand-accent)]/15">
                    <User className="w-5 h-5 text-[var(--brand-secondary)]" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{selected.name}</p>
                    <p className="text-xs" style={{ color: 'var(--subtle-foreground)' }}>{selected.phone}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  {insights.report_count} report{insights.report_count === 1 ? '' : 's'} analyzed
                </span>
              </div>
              <p className="text-sm leading-relaxed mt-4 pl-4 border-l-2" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--brand-secondary)' }}>
                {insights.summary}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="surface rounded-2xl p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
                  <TrendingUp className="w-4 h-4 text-[var(--brand-secondary)]" /> Trajectory Insights
                </h3>
                {insights.trajectory_insights.length > 0 ? (
                  <ul className="space-y-2">
                    {insights.trajectory_insights.map((t, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--foreground)' }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--brand-secondary)' }} />
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing notable identified.</p>
                )}
              </div>

              <div className="surface rounded-2xl p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Progression Risks
                </h3>
                {insights.progression_risks.length > 0 ? (
                  <ul className="space-y-2">
                    {insights.progression_risks.map((r, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--foreground)' }}>
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No progression risks identified.</p>
                )}
              </div>

              <div className="surface rounded-2xl p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--foreground)' }}>
                  <Activity className="w-4 h-4 text-[var(--brand-accent)]" /> Biomarker Changes
                </h3>
                {insights.biomarker_changes.length > 0 ? (
                  <ul className="space-y-2">
                    {insights.biomarker_changes.map((b, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--foreground)' }}>
                        <TrendingDown className="w-3.5 h-3.5 mt-0.5 text-[var(--brand-accent)] flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No biomarker changes to report.</p>
                )}
              </div>
            </div>

            <p className="text-xs text-center italic" style={{ color: 'var(--subtle-foreground)' }}>{insights.disclaimer}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === 'search' && !error && (
        <EmptyState
          icon={TrendingUp}
          title="Search for a patient"
          description="Enter a phone number above to pull their last 3 reports and run an AI trend analysis."
        />
      )}
    </div>
  );
}
