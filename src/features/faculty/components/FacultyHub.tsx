import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  ArrowRight,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/enums';
import type { Team, TeamMilestone } from '@/types/schemas/team';
import { FacultyReviewModal } from './FacultyReviewModal';

export const FacultyHub: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { teams } = useTeams();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'needs_revision' | 'in_progress'>('all');

  // Active Team & Milestone for Review Modal
  const [reviewModalTeam, setReviewModalTeam] = useState<Team | null>(null);
  const [reviewModalMilestone, setReviewModalMilestone] = useState<TeamMilestone | undefined>(undefined);

  // Computed metrics across all teams
  const metrics = useMemo(() => {
    let totalProjects = teams.length;
    let pendingCount = 0;
    let approvedCount = 0;
    let revisionCount = 0;

    teams.forEach((team) => {
      const milestones = team.milestones || [];
      milestones.forEach((m) => {
        if (m.status === 'pending_review') pendingCount++;
        if (m.status === 'approved') approvedCount++;
        if (m.status === 'needs_revision') revisionCount++;
      });
    });

    return { totalProjects, pendingCount, approvedCount, revisionCount };
  }, [teams]);

  // Filtered teams list
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      // 1. Search Query
      const matchesSearch =
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.members.some((m) => m.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const hasStatus = (team.milestones || []).some((m) => m.status === statusFilter);
        if (!hasStatus) return false;
      }

      return true;
    });
  }, [teams, searchQuery, statusFilter]);

  const handleOpenReview = (team: Team, milestone?: TeamMilestone) => {
    setReviewModalTeam(team);
    setReviewModalMilestone(milestone);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* ── FACULTY HUB HERO HEADER ── */}
      <div className="commons-card p-6 sm:p-8 bg-[var(--surface)] border border-[var(--line)] rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 flex items-center justify-center shrink-0 shadow-inner">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                  <ShieldCheck className="w-3 h-3" />
                  Faculty Supervision & Tracking Hub
                </span>
                <span className="text-xs text-[var(--muted)]">• Academic Session 2026–27</span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
                Project Milestone & Evaluation Portal
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
                Supervise student research & engineering teams, review code deliverables, approve phase milestones, and provide direct rubric feedback.
              </p>
            </div>
          </div>

          {/* Guide Badge / Info Card */}
          <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white font-bold flex items-center justify-center text-sm">
              {profile?.fullName?.slice(0, 1) || 'F'}
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--ink)]">
                {profile?.fullName || 'Dr. Aris Thorne'}
              </div>
              <div className="text-[11px] text-[var(--muted)] font-mono">
                {profile?.role === UserRole.FACULTY ? 'Faculty Evaluator' : 'Faculty / Administrator'}
              </div>
            </div>
          </div>
        </div>

        {/* ── TOP KPI METRIC TELEMETRY CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-[var(--line)]">
          <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex flex-col gap-1">
            <span className="text-[11px] font-mono font-medium text-[var(--muted)] uppercase tracking-wider">
              Monitored Projects
            </span>
            <div className="text-2xl font-bold font-mono text-[var(--ink)]">
              {metrics.totalProjects}
            </div>
            <span className="text-[11px] text-[var(--muted)]">Active student cohorts</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/25 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Pending Reviews
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {metrics.pendingCount}
            </div>
            <span className="text-[11px] text-[var(--muted)]">Awaiting faculty sign-off</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/25 flex flex-col gap-1">
            <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Phases Approved
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.approvedCount}
            </div>
            <span className="text-[11px] text-[var(--muted)]">Milestones signed-off</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/[0.04] border border-rose-500/25 flex flex-col gap-1">
            <span className="text-[11px] font-mono font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Revision Requested
            </span>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {metrics.revisionCount}
            </div>
            <span className="text-[11px] text-[var(--muted)]">Flagged for student fixes</span>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, abstract, or student name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] shadow-xs"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            All ({teams.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending_review')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'pending_review'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-amber-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Needs Review ({metrics.pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-emerald-500'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </button>
          <button
            onClick={() => setStatusFilter('needs_revision')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'needs_revision'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-rose-500'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Revision</span>
          </button>
        </div>
      </div>

      {/* ── PROJECT TRACKING MATRIX / TABLE ── */}
      <div className="commons-card bg-[var(--surface)] border border-[var(--line)] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-heading text-sm font-bold text-[var(--ink)]">
              Student Project Teams & Milestone Progress ({filteredTeams.length})
            </h3>
          </div>
          <span className="text-xs text-[var(--muted)] font-mono">
            Direct two-way feedback loop
          </span>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-heading text-base font-bold text-[var(--ink)]">
              No matching student project teams found
            </h4>
            <p className="text-xs text-[var(--muted)] max-w-sm mt-1">
              Try adjusting your search criteria or filter to see monitored student projects.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filteredTeams.map((team) => {
              const milestones = team.milestones || [];
              const pendingMilestone = milestones.find((m) => m.status === 'pending_review');
              const activeMilestone = pendingMilestone || milestones[0];
              const approvedCount = milestones.filter((m) => m.status === 'approved').length;
              const leadMember = team.members.find((m) => m.role === 'lead') || team.members[0];

              return (
                <div
                  key={team.id}
                  className="p-5 sm:p-6 hover:bg-[var(--bg)]/50 transition-colors flex flex-col gap-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Project & Team Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] font-heading font-bold text-lg flex items-center justify-center shrink-0">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4
                            onClick={() => navigate(`/teams/${team.id}`)}
                            className="font-heading text-base font-bold text-[var(--ink)] hover:text-[var(--accent)] cursor-pointer truncate"
                          >
                            {team.name}
                          </h4>
                          {team.tableNumber && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--line)] text-[var(--muted)]">
                              Table {team.tableNumber}
                            </span>
                          )}
                          {pendingMilestone && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Review Pending
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5 max-w-xl">
                          {team.description || 'No project hypothesis submitted.'}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--muted)] flex-wrap">
                          <span className="font-mono">
                            Lead: <strong className="text-[var(--ink)]">{leadMember?.user?.fullName || 'Student Lead'}</strong>
                          </span>
                          <span>•</span>
                          <span>{team.members.length} Collaborator{team.members.length === 1 ? '' : 's'}</span>
                          <span>•</span>
                          <span className="text-[var(--accent)] font-medium">
                            Guide: {team.assignedFaculty?.name || 'Dr. Aris Thorne'}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[var(--moss)]">
                            {approvedCount}/{milestones.length} Completed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto">
                      <button
                        onClick={() => handleOpenReview(team, activeMilestone)}
                        className="commons-btn-primary py-2 px-3.5 text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Evaluate & Grade</span>
                      </button>

                      <button
                        onClick={() => navigate(`/teams/${team.id}`)}
                        className="commons-btn-secondary py-2 px-3 text-xs flex items-center gap-1 cursor-pointer"
                        title="View Full Team Profile"
                      >
                        <span>View Project</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate('/chat')}
                        className="p-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all cursor-pointer"
                        title="Direct Chat with Team"
                      >
                        <MessageSquare className="w-4 h-4 text-[var(--sky)]" />
                      </button>
                    </div>
                  </div>

                  {/* ── MILESTONE PHASE STEPPER PIPELINE ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    {milestones.map((m) => {
                      const isApproved = m.status === 'approved';
                      const isPending = m.status === 'pending_review';
                      const isRevision = m.status === 'needs_revision';

                      return (
                        <div
                          key={m.id}
                          onClick={() => handleOpenReview(team, m)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                            isApproved
                              ? 'border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500'
                              : isPending
                              ? 'border-amber-500/40 bg-amber-500/[0.04] hover:border-amber-500'
                              : isRevision
                              ? 'border-rose-500/30 bg-rose-500/[0.03] hover:border-rose-500'
                              : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                              Phase {m.phase}
                            </span>
                            {isApproved && (
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3" /> Review Due
                              </span>
                            )}
                            {isRevision && (
                              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Revision
                              </span>
                            )}
                            {!isApproved && !isPending && !isRevision && (
                              <span className="text-[10px] text-[var(--muted)]">
                                In Progress
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-semibold text-[var(--ink)] truncate">
                            {m.title.replace(/^Phase \d+:\s*/, '')}
                          </div>

                          {m.score !== undefined && (
                            <div className="text-[11px] font-mono text-[var(--accent)] font-bold">
                              Grade: {m.score} / 10
                            </div>
                          )}

                          {m.facultyRemarks && (
                            <p className="text-[11px] text-[var(--muted)] line-clamp-1 italic">
                              "{m.facultyRemarks}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalTeam && (
        <FacultyReviewModal
          isOpen={Boolean(reviewModalTeam)}
          onClose={() => setReviewModalTeam(null)}
          team={reviewModalTeam}
          initialMilestone={reviewModalMilestone}
        />
      )}
    </div>
  );
};
