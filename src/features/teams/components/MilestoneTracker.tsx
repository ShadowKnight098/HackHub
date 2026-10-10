import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  ExternalLink,
  MessageSquare,
  Award,
  ShieldCheck,
  FileCode,
  X,
} from 'lucide-react';
import type { Team, TeamMilestone } from '@/types/schemas/team';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/enums';
import { useTeams } from '../hooks/useTeams';

interface MilestoneTrackerProps {
  team: Team;
  isLead?: boolean;
  onOpenFacultyReview?: (milestone: TeamMilestone) => void;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  team,
  isLead = false,
  onOpenFacultyReview,
}) => {
  const { profile } = useAuth();
  const { submitMilestone, isSubmittingMilestone } = useTeams();

  const isFacultyOrAdmin =
    profile?.role === UserRole.FACULTY || profile?.role === UserRole.ADMIN;

  const milestones: TeamMilestone[] = team.milestones || [];

  // State for student submission modal
  const [activeSubmittingMilestone, setActiveSubmittingMilestone] =
    useState<TeamMilestone | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleOpenSubmit = (m: TeamMilestone) => {
    setActiveSubmittingMilestone(m);
    setSubmissionUrl(m.submissionUrl || '');
    setSubmissionNotes(m.submissionNotes || '');
    setSubmitError(null);
  };

  const handleConfirmSubmit = async () => {
    if (!activeSubmittingMilestone) return;
    if (!submissionUrl.trim() && !submissionNotes.trim()) {
      setSubmitError('Please provide a repository/document URL or submission summary.');
      return;
    }

    try {
      await submitMilestone({
        teamId: team.id,
        milestoneId: activeSubmittingMilestone.id,
        submission: {
          submissionUrl: submissionUrl.trim(),
          submissionNotes: submissionNotes.trim(),
        },
      });
      setActiveSubmittingMilestone(null);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit deliverable. Please try again.');
    }
  };

  const getStatusBadge = (status: TeamMilestone['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved by Faculty</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Faculty Review</span>
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Revision Requested</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--line)] text-[var(--muted)] border border-[var(--line)]">
            <Clock className="w-3.5 h-3.5" />
            <span>In Progress</span>
          </span>
        );
    }
  };

  // Overall milestone progress calculation
  const approvedCount = milestones.filter((m) => m.status === 'approved').length;
  const progressPercent = milestones.length > 0 ? Math.round((approvedCount / milestones.length) * 100) : 0;

  return (
    <div className="commons-card p-6 sm:p-7 bg-[var(--surface)] border border-[var(--line)] rounded-2xl flex flex-col gap-6">
      {/* Header with Faculty Guide and Progress Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-heading text-lg font-bold text-[var(--ink)]">
              Academic Milestone & Supervision Pipeline
            </h3>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Official project checkpoints supervised by{' '}
            <span className="font-medium text-[var(--ink)]">
              {team.assignedFaculty?.name || 'Assigned Faculty Guide'}
            </span>
            {team.assignedFaculty?.department ? ` • ${team.assignedFaculty.department}` : ''}
          </p>
        </div>

        {/* Milestone Completion Meter */}
        <div className="flex items-center gap-4 bg-[var(--bg)] px-4 py-2.5 rounded-xl border border-[var(--line)] shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-[var(--muted)] font-mono uppercase tracking-wider">
              Evaluated Progress
            </div>
            <div className="text-sm font-bold font-mono text-[var(--ink)]">
              {approvedCount} / {milestones.length} Phases Approved ({progressPercent}%)
            </div>
          </div>
          <div className="w-16 h-2 rounded-full bg-[var(--line)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestone Cards List */}
      <div className="flex flex-col gap-4">
        {milestones.map((milestone, idx) => {
          const isPending = milestone.status === 'pending_review';
          const isApproved = milestone.status === 'approved';
          const needsRevision = milestone.status === 'needs_revision';

          return (
            <div
              key={milestone.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                isApproved
                  ? 'border-emerald-500/25 bg-emerald-500/[0.02]'
                  : isPending
                  ? 'border-amber-500/30 bg-amber-500/[0.02]'
                  : needsRevision
                  ? 'border-rose-500/30 bg-rose-500/[0.02]'
                  : 'border-[var(--line)] bg-[var(--surface)]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      isApproved
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : needsRevision
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]'
                    }`}
                  >
                    P{milestone.phase || idx + 1}
                  </div>
                  <div>
                    <h4 className="font-heading text-sm sm:text-base font-bold text-[var(--ink)]">
                      {milestone.title}
                    </h4>
                    {milestone.dueDate && (
                      <p className="text-[11px] text-[var(--muted)] font-mono">
                        Target Deadline: {milestone.dueDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  {getStatusBadge(milestone.status)}

                  {milestone.score !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                      <Award className="w-3.5 h-3.5" />
                      <span>{milestone.score} / 10</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Submission metadata (if student submitted) */}
              {(milestone.submissionUrl || milestone.submissionNotes) && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-xs flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-[var(--accent)]" />
                      Student Submission
                    </span>
                    {milestone.submittedAt && (
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        Submitted on {new Date(milestone.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {milestone.submissionUrl && (
                    <div className="flex items-center gap-1.5 text-[var(--ink)] font-mono text-xs">
                      <ExternalLink className="w-3 h-3 text-[var(--accent)] shrink-0" />
                      <a
                        href={milestone.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] hover:underline truncate"
                      >
                        {milestone.submissionUrl}
                      </a>
                    </div>
                  )}

                  {milestone.submissionNotes && (
                    <p className="text-xs text-[var(--muted)] leading-relaxed italic">
                      "{milestone.submissionNotes}"
                    </p>
                  )}
                </div>
              )}

              {/* Faculty Remarks Callout */}
              {milestone.facultyRemarks && (
                <div className="mt-3 p-3.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Faculty Evaluation Remarks ({milestone.reviewedBy || 'Faculty Guide'})
                    </span>
                    {milestone.reviewedAt && (
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        {new Date(milestone.reviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ink)] font-sans leading-relaxed pt-1">
                    "{milestone.facultyRemarks}"
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 border-t border-[var(--line)]">
                <span className="text-[11px] text-[var(--muted)] font-mono">
                  {isApproved
                    ? 'Phase finalized & verified'
                    : isPending
                    ? 'Awaiting faculty evaluation'
                    : needsRevision
                    ? 'Please review feedback & submit update'
                    : 'Phase ready for deliverable submission'}
                </span>

                <div className="flex items-center gap-2">
                  {/* Faculty Review / Evaluate Button */}
                  {isFacultyOrAdmin && onOpenFacultyReview && (
                    <button
                      onClick={() => onOpenFacultyReview(milestone)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Evaluate Phase</span>
                    </button>
                  )}

                  {/* Student Submit / Re-submit Button */}
                  {isLead && !isApproved && (
                    <button
                      onClick={() => handleOpenSubmit(milestone)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all flex items-center gap-1 text-[var(--ink)] shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{milestone.submissionUrl ? 'Update Deliverable' : 'Submit for Review'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Submission Modal */}
      <AnimatePresence>
        {activeSubmittingMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                    P{activeSubmittingMilestone.phase}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-[var(--ink)]">
                      Submit Deliverable for Faculty Review
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      {activeSubmittingMilestone.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubmittingMilestone(null)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Repository or Deliverable Link (GitHub, Figma, Docs, Demo URL)
                  </label>
                  <input
                    type="url"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://github.com/organization/project-milestone"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Submission Notes & Summary for Faculty Guide
                  </label>
                  <textarea
                    rows={4}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Describe what your team completed in this phase, key architectural choices, and any areas where you seek faculty guidance..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setActiveSubmittingMilestone(null)}
                  className="px-4 py-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmittingMilestone}
                  className="commons-btn-primary py-2 px-5 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingMilestone ? 'Submitting...' : 'Submit to Faculty Guide'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
