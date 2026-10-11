import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Spinner } from '@heroui/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Crown,
  MapPin,
  Users,
  Calendar,
  FolderGit2,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import { useTeamDetail } from '../hooks/useTeams';
import { AddMemberModal } from './AddMemberModal';
import { MilestoneTracker } from './MilestoneTracker';
import { FacultyReviewModal } from '@/features/faculty/components/FacultyReviewModal';
import { useAuth } from '@/features/auth';
import type { TeamId } from '@/types/ids';
import type { TeamMilestone } from '@/types/schemas/team';

export const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: team, isLoading, isError } = useTeamDetail(id as TeamId);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [reviewingMilestone, setReviewingMilestone] = useState<TeamMilestone | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" color="primary" label="Loading team profile..." />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="commons-card p-12 text-center max-w-lg mx-auto my-12 bg-[var(--surface)]">
        <h2 className="font-heading text-xl text-[var(--ink)]">Team not found</h2>
        <p className="text-xs text-[var(--muted)] mt-2">The team requested does not exist or has concluded.</p>
        <button
          className="commons-btn-primary mt-6"
          onClick={() => navigate('/teams')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Teams Directory</span>
        </button>
      </div>
    );
  }

  const isLead = profile && team.members.some((m) => m.userId === profile.id && m.role === 'lead');
  const isMember = profile && team.members.some((m) => m.userId === profile.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col gap-6"
    >
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/teams')}
          className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Teams Directory</span>
        </button>
      </div>

      {/* Main Team Hero Banner */}
      <div className="commons-card p-6 sm:p-8 bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-heading text-2xl font-bold shrink-0 shadow-xs">
              {team.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">{team.name}</h1>
                {isLead && (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    Team Lead
                  </span>
                )}
                {isMember && !isLead && (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Team Member
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {team.tableNumber && (
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Table {team.tableNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Formed on {new Date(team.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{team.members.length} Collaborator{team.members.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              className="commons-btn-primary flex-1 md:flex-initial"
              onClick={() => navigate('/resources')}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Team Resources</span>
            </button>
            <button
              className="commons-btn-secondary flex-1 md:flex-initial"
              onClick={() => navigate('/chat')}
            >
              <MessageSquare className="w-4 h-4 text-[var(--sky)]" />
              <span>Channel Chat</span>
            </button>
          </div>
        </div>

        {/* Pitch / Overview */}
        <div className="mt-8 border-t border-[var(--line)] pt-6">
          <h3 className="font-heading text-sm text-[var(--ink)] uppercase tracking-wider mb-2">
            Project Abstract & Hypothesis
          </h3>
          <p className="text-sm text-[var(--muted)] leading-relaxed max-w-4xl">
            {team.description || 'No pitch summary has been submitted for this project yet.'}
          </p>
        </div>
      </div>

      {/* ── ACADEMIC MILESTONE & FACULTY EVALUATION PIPELINE ── */}
      <MilestoneTracker
        team={team}
        isLead={Boolean(isLead)}
        onOpenFacultyReview={(m) => setReviewingMilestone(m)}
      />

      {/* Roster & Members section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl text-[var(--ink)] flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--muted)]" />
            <span>Team Roster ({team.members.length})</span>
          </h2>
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="commons-btn-primary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member or Leader</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="commons-card p-4 bg-[var(--surface)] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={member.user?.avatarUrl || undefined}
                  name={member.user?.fullName?.slice(0, 1) || 'U'}
                  className="w-9 h-9 text-xs border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-medium text-xs text-[var(--ink)] truncate">{member.user?.fullName || 'Collaborator'}</h4>
                  <p className="text-[11px] text-[var(--muted)] truncate">{member.user?.email || 'Participant'}</p>
                </div>
              </div>

              {member.role === 'lead' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 text-amber-700 bg-amber-50 shrink-0">
                  <Crown className="w-3 h-3 text-amber-600" />
                  Lead
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-600 bg-slate-50 shrink-0 font-medium">
                  Member
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        teamId={team.id}
        teamName={team.name}
      />

      {/* Faculty Review Modal */}
      {reviewingMilestone && (
        <FacultyReviewModal
          isOpen={Boolean(reviewingMilestone)}
          onClose={() => setReviewingMilestone(null)}
          team={team}
          initialMilestone={reviewingMilestone}
        />
      )}
    </motion.div>
  );
};
