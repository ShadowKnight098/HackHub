import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  FileCode,
} from 'lucide-react';
import type { Team, TeamMilestone } from '@/types/schemas/team';
import { useAuth } from '@/features/auth';
import { useTeams } from '@/features/teams/hooks/useTeams';

interface FacultyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  initialMilestone?: TeamMilestone;
}

const QUICK_REMARK_PRESETS = [
  'Architecture spec verified and well structured. Approved for implementation phase.',
  'Good progress on core APIs. Ensure JWT expiration and CORS handling are completed.',
  'Deliverable requires unit test coverage and schema validation before sign-off.',
  'UI state flow is responsive and well-scoped. Excellent progress.',
  'Milestone approved. Please schedule mid-term presentation review.',
];

export const FacultyReviewModal: React.FC<FacultyReviewModalProps> = ({
  isOpen,
  onClose,
  team,
  initialMilestone,
}) => {
  const { profile } = useAuth();
  const { updateMilestone, isUpdatingMilestone } = useTeams();

  const milestones: TeamMilestone[] = team.milestones || [];
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    initialMilestone?.id || milestones[0]?.id || ''
  );

  const activeMilestone =
    milestones.find((m) => m.id === selectedMilestoneId) || milestones[0];

  const [status, setStatus] = useState<TeamMilestone['status']>(
    activeMilestone?.status || 'in_progress'
  );
  const [score, setScore] = useState<string>(
    activeMilestone?.score !== undefined ? String(activeMilestone.score) : '8.5'
  );
  const [remarks, setRemarks] = useState<string>(
    activeMilestone?.facultyRemarks || ''
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When changing milestone selector, sync local state
  const handleSelectMilestone = (mId: string) => {
    setSelectedMilestoneId(mId);
    const m = milestones.find((x) => x.id === mId);
    if (m) {
      setStatus(m.status);
      setScore(m.score !== undefined ? String(m.score) : '8.5');
      setRemarks(m.facultyRemarks || '');
    }
  };

  const handleApplyPreset = (preset: string) => {
    setRemarks((prev) => (prev ? `${prev} ${preset}` : preset));
  };

  const handleSubmitEvaluation = async () => {
    if (!activeMilestone) return;

    if (!remarks.trim()) {
      setErrorMsg('Please enter feedback remarks for the student team.');
      return;
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      setErrorMsg('Please enter a valid evaluation score between 0 and 10.');
      return;
    }

    try {
      await updateMilestone({
        teamId: team.id,
        milestoneId: activeMilestone.id,
        updates: {
          status,
          score: numericScore,
          facultyRemarks: remarks.trim(),
        },
        reviewRemarks: {
          facultyName: profile?.fullName || 'Faculty Guide',
          remarks: remarks.trim(),
          score: numericScore,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit faculty review.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-[var(--ink)]">
                Faculty Evaluation & Assessment
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Team: <span className="font-semibold text-[var(--ink)]">{team.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Milestone Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
            Select Project Phase to Evaluate
          </label>
          <div className="grid grid-cols-3 gap-2">
            {milestones.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMilestone(m.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  m.id === selectedMilestoneId
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  Phase {m.phase}
                </span>
                <span className="text-xs font-semibold truncate leading-tight">
                  {m.title.replace(/^Phase \d+:\s*/, '')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Student Submission Overview */}
        {activeMilestone && (
          <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                Student Deliverable
              </span>
              {activeMilestone.submittedAt && (
                <span className="text-[10px] text-[var(--muted)] font-mono">
                  Submitted: {new Date(activeMilestone.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {activeMilestone.submissionUrl ? (
              <div className="flex items-center gap-2 text-xs">
                <ExternalLink className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <a
                  href={activeMilestone.submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] hover:underline truncate font-mono"
                >
                  {activeMilestone.submissionUrl}
                </a>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] italic">
                No external URL provided yet.
              </p>
            )}

            {activeMilestone.submissionNotes && (
              <p className="text-xs text-[var(--ink)] leading-relaxed italic border-t border-[var(--line)] pt-1.5">
                "{activeMilestone.submissionNotes}"
              </p>
            )}
          </div>
        )}

        {/* Status Decision Buttons */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-2">
            Evaluation Outcome
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus('approved')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50 shadow-xs'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Phase</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('needs_revision')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                status === 'needs_revision'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/50 shadow-xs'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Needs Revision</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('in_progress')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                status === 'in_progress'
                  ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/50 shadow-xs'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </button>
          </div>
        </div>

        {/* Evaluation Score (0 - 10) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[var(--ink)]">
              Rubric Score (out of 10)
            </label>
            <span className="text-xs font-mono font-bold text-[var(--accent)]">
              {score} / 10
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="flex-1 accent-[var(--accent)] cursor-pointer"
            />
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-16 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] text-center focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Feedback Remarks */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
            Faculty Feedback & Mentorship Remarks
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Write constructive guidance, required changes, or praise for this milestone deliverable..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] resize-none"
          />

          {/* Quick Remark Presets */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-[var(--muted)] font-mono self-center mr-1">
              Suggestions:
            </span>
            {QUICK_REMARK_PRESETS.slice(0, 3).map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all cursor-pointer"
              >
                + {preset.slice(0, 35)}...
              </button>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitEvaluation}
            disabled={isUpdatingMilestone}
            className="commons-btn-primary py-2 px-5 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Award className="w-3.5 h-3.5" />
            <span>{isUpdatingMilestone ? 'Recording...' : 'Save Assessment'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
