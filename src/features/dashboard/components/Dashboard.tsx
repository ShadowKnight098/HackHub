import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowRight,
  Plus,
  Bell,
  ChevronRight,
  GraduationCap,
  Award,
  Clock,
} from 'lucide-react';
import { Avatar, AvatarGroup } from '@heroui/react';
import { useAuth } from '@/features/auth';
import { useTeams } from '@/features/teams';
import { useResources } from '@/features/resources';
import { useNotes } from '@/features/notes';
import { SharedPhotoGallery } from './SharedPhotoGallery';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.05 } },
};

const HOURS_LEFT = 26;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { teams } = useTeams();
  const { resources } = useResources();
  const { notes } = useNotes();

  const myTeam = profile
    ? teams.find((t) => t.members.some((m) => m.userId === profile.id))
    : null;

  const pendingReviewsCount = teams.reduce((acc, t) => {
    return acc + (t.milestones || []).filter((m) => m.status === 'pending_review').length;
  }, 0);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* ── HEADER & PRIMARY ACTIONS ────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-[1.5px] border-[#191A23]"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="tag-highlight text-[11px] font-mono uppercase tracking-wider">
              Academic Session 2026
            </span>
            <span className="text-xs text-[#191A23] font-semibold">
              &bull; {HOURS_LEFT}h Remaining
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold text-[#191A23] tracking-tight">
            Welcome back, {profile?.fullName?.split(' ')[0] ?? 'Builder'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-xl">
            Everything you need for faculty supervision, team collaboration, and venue navigation in one unified platform.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {myTeam ? (
            <button
              className="commons-btn-primary"
              onClick={() => navigate(`/teams/${myTeam.id}`)}
            >
              <span>My Team: {myTeam.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="commons-btn-primary"
              onClick={() => navigate('/teams')}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Join or Create Team</span>
            </button>
          )}

          <button
            className="commons-btn-secondary"
            onClick={() => navigate('/map')}
          >
            <MapPin className="w-4 h-4 text-[#191A23]" />
            <span>Floor Map</span>
          </button>
        </div>
      </motion.div>

      {/* ── FACULTY SUPERVISION & MILESTONE TRACKING BANNER ── */}
      <motion.div variants={fadeUp}>
        <div className="commons-card p-6 sm:p-7 bg-[#F3F3F3] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B9FF66] text-[#191A23] border-[1.5px] border-[#191A23] flex items-center justify-center shrink-0 shadow-[0_3px_0_#191A23]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="tag-highlight text-xs uppercase font-mono">
                  Supervision & Tracking
                </span>
                {pendingReviewsCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#191A23] text-[#B9FF66] border border-[#191A23]">
                    <Clock className="w-3 h-3" />
                    {pendingReviewsCount} Review{pendingReviewsCount === 1 ? '' : 's'} Due
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFFFF] text-[#191A23] border border-[#191A23]">
                    Active Supervision
                  </span>
                )}
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#191A23]">
                Faculty Milestone & Evaluation Portal
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5 max-w-2xl leading-relaxed">
                Supervise student team milestones, verify architecture & prototype deliverables, and provide graded feedback remarks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <button
              onClick={() => navigate('/faculty')}
              className="commons-btn-primary"
            >
              <Award className="w-4 h-4" />
              <span>Open Faculty Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── 3 CORE POSITIVUS DUAL-CARD OVERVIEWS ───────────────── */}
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Team status (Soft Gray Card) */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => (myTeam ? navigate(`/teams/${myTeam.id}`) : navigate('/teams'))}
            className="commons-card p-6 h-full bg-[#F3F3F3] flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <span className="tag-highlight text-sm font-heading">
                    Team Project
                  </span>
                  <span className="tag-highlight text-sm font-heading">
                    Workspace
                  </span>
                </div>
                <div className="btn-circle-arrow">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-lg font-bold text-[#191A23] mb-1.5">
                {myTeam ? myTeam.name : 'No Team Assigned'}
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                {myTeam
                  ? myTeam.description || `Active at ${myTeam.tableNumber ? `Table ${myTeam.tableNumber}` : 'the main venue floor'}.`
                  : 'Join existing innovators or register a new project group to compete.'}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t-[1.5px] border-[#191A23] flex items-center justify-between text-xs text-[#191A23] font-medium">
              {myTeam ? (
                <>
                  <span className="font-mono text-xs font-semibold">{myTeam.tableNumber ? `Table ${myTeam.tableNumber}` : 'Floor Area'}</span>
                  <AvatarGroup isBordered size="sm" max={3} className="[&_*]:w-6 [&_*]:h-6 [&_*]:text-[9px] [&_*]:border-white">
                    {myTeam.members.map((m) => (
                      <Avatar
                        key={m.id}
                        src={m.user?.avatarUrl ?? undefined}
                        name={m.user?.fullName?.slice(0, 1) ?? 'U'}
                      />
                    ))}
                  </AvatarGroup>
                </>
              ) : (
                <span className="text-xs font-bold text-[#191A23] underline decoration-[#B9FF66] decoration-2">
                  Click to form a team &rarr;
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* 2. Venue Map (Electric Lime Card) */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/map')}
            className="commons-card p-6 h-full bg-[#B9FF66] flex flex-col justify-between cursor-pointer group text-[#191A23]"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <span className="tag-highlight-white text-sm font-heading">
                    Interactive
                  </span>
                  <span className="tag-highlight-white text-sm font-heading">
                    Floor Plan
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#191A23] text-white flex items-center justify-center transition-transform group-hover:scale-105">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-lg font-bold text-[#191A23] mb-1.5">
                Venue Navigation
              </h3>
              <p className="text-xs text-[#191A23]/80 leading-relaxed font-medium">
                Locate your assigned table, presentation stages, mentor booths, and refreshments with live GPS tracking.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t-[1.5px] border-[#191A23] flex items-center justify-between text-xs text-[#191A23] font-bold">
              <span>Interactive GPS</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-[#191A23]">48 Tables</span>
            </div>
          </div>
        </motion.div>

        {/* 3. Resources & Notes (Obsidian Dark Card) */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/resources')}
            className="commons-card p-6 h-full bg-[#191A23] text-white flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <span className="tag-highlight text-sm font-heading">
                    Documentation
                  </span>
                  <span className="tag-highlight text-sm font-heading">
                    & Starter APIs
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white text-[#191A23] flex items-center justify-center transition-transform group-hover:scale-105">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-lg font-bold text-white mb-1.5">
                Resources & APIs
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Shared starter repositories, API keys, presentation templates, and architecture references.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t-[1.5px] border-white/20 flex items-center justify-between text-xs text-gray-300 font-medium">
              <span>{resources.length} active documents</span>
              <span className="font-mono text-xs font-bold text-[#B9FF66]">{notes.length} Notes</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── SHARED PROTOTYPES & COHORT PHOTO STREAM ────────────── */}
      <motion.div variants={fadeUp}>
        <SharedPhotoGallery />
      </motion.div>

      {/* ── MAIN CONTENT SPLIT: NOTES & FLOOR ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Notes */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="commons-card p-6 sm:p-7 bg-white h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b-[1.5px] border-[#191A23] mb-5">
              <div className="flex items-center gap-3">
                <span className="tag-highlight font-heading text-base font-bold">
                  Team Notes
                </span>
                <span className="text-xs text-[#6B7280] hidden sm:inline">
                  Collaborative ideas, questions, and architecture logs
                </span>
              </div>
              <button
                onClick={() => navigate('/notes')}
                className="text-xs font-bold text-[#191A23] hover:underline flex items-center gap-1 group"
              >
                View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="py-12 text-center text-[#6B7280] text-xs">
                No notes posted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {notes.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate('/notes')}
                    className="p-4 rounded-[18px] border-[1.5px] border-[#191A23] bg-[#F3F3F3] hover:bg-white hover:shadow-[0_4px_0_#191A23] cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-heading font-bold text-sm text-[#191A23] line-clamp-1">{note.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#191A23] bg-white text-[#191A23] font-bold capitalize shrink-0">
                          {note.visibility}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                        {note.content}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-3 border-t border-[#191A23]/20 flex items-center justify-between text-[11px] text-[#6B7280]">
                      <span className="truncate font-medium">{note.author?.fullName ?? 'Author'}</span>
                      <span className="text-[#191A23] font-bold group-hover:underline">Read &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right 1 Col: Announcement & Teams Quick View */}
        <motion.div variants={fadeUp} className="flex flex-col gap-5">
          {/* Latest Announcement */}
          <div className="commons-card p-6 bg-[#B9FF66] text-[#191A23]">
            <div className="flex items-center gap-2 mb-2">
              <span className="tag-highlight-dark text-[10px] font-mono uppercase tracking-wider">
                <Bell className="w-3 h-3 text-[#B9FF66]" />
                Announcement
              </span>
            </div>
            <h4 className="font-heading font-bold text-base text-[#191A23] mb-1.5">
              Midway Architecture Review & Mentor Office Hours
            </h4>
            <p className="text-xs text-[#191A23]/80 leading-relaxed font-medium">
              Mentors are available at helpdesk booths. Pitch slide templates are ready in the resources section.
            </p>
          </div>

          {/* Active Teams on Floor */}
          <div className="commons-card p-6 bg-white flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-[#191A23] mb-4">
                <span className="tag-highlight font-heading text-sm font-bold">
                  Active Teams
                </span>
                <button
                  onClick={() => navigate('/teams')}
                  className="text-xs font-bold text-[#191A23] hover:underline"
                >
                  All ({teams.length})
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {teams.slice(0, 3).map((team) => (
                  <div
                    key={team.id}
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="p-3 rounded-[14px] border-[1.5px] border-[#191A23] bg-[#F3F3F3] hover:bg-white hover:shadow-[0_3px_0_#191A23] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-[#191A23] truncate">{team.name}</p>
                      <span className="text-[10px] text-[#6B7280] font-mono font-semibold">
                        {team.tableNumber ? `Table ${team.tableNumber}` : 'Unassigned'}
                      </span>
                    </div>

                    <AvatarGroup isBordered size="sm" max={3} className="[&_*]:w-6 [&_*]:h-6 [&_*]:text-[8px] [&_*]:border-white shrink-0">
                      {team.members.map((m) => (
                        <Avatar
                          key={m.id}
                          size="sm"
                          src={m.user?.avatarUrl ?? undefined}
                          name={m.user?.fullName?.slice(0, 1) ?? 'U'}
                        />
                      ))}
                    </AvatarGroup>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/teams')}
              className="commons-btn-secondary mt-4 w-full text-xs"
            >
              Browse all teams &rarr;
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
