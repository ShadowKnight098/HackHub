import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FolderGit2,
  MapPin,
  ArrowRight,
  Plus,
  Bell,
  ChevronRight,
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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--line)]"
      >
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--moss)] inline-block" />
            <span>Hackathon 2026 &bull; {HOURS_LEFT}h Remaining</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading text-[var(--ink)]">
            Welcome back, {profile?.fullName?.split(' ')[0] ?? 'Builder'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
            Everything you need for collaboration, venue navigation, and notes in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {myTeam ? (
            <button
              className="commons-btn-primary py-2 px-3.5 text-xs"
              onClick={() => navigate(`/teams/${myTeam.id}`)}
            >
              <span>My Team: {myTeam.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              className="commons-btn-primary py-2 px-3.5 text-xs"
              onClick={() => navigate('/teams')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Join or Create Team</span>
            </button>
          )}

          <button
            className="commons-btn-secondary py-2 px-3.5 text-xs"
            onClick={() => navigate('/map')}
          >
            <MapPin className="w-3.5 h-3.5 text-[var(--moss)]" />
            <span>Floor Map</span>
          </button>
        </div>
      </motion.div>

      {/* ── 3 CORE OVERVIEW CARDS ───────────────────────────────── */}
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Team status */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => (myTeam ? navigate(`/teams/${myTeam.id}`) : navigate('/teams'))}
            className="commons-card p-5 h-full flex flex-col justify-between cursor-pointer hover:border-[var(--accent)] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--accent)]">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--moss)] group-hover:underline">
                  {myTeam ? 'Team Workspace &rarr;' : 'Explore &rarr;'}
                </span>
              </div>
              <h3 className="font-heading text-base text-[var(--ink)] mb-1">
                {myTeam ? myTeam.name : 'No Team Assigned'}
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
                {myTeam
                  ? myTeam.description || `Active at ${myTeam.tableNumber ? `Table ${myTeam.tableNumber}` : 'the main venue floor'}.`
                  : 'Join existing innovators or register a new project group to compete.'}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--muted)]">
              {myTeam ? (
                <>
                  <span className="font-mono text-[11px]">{myTeam.tableNumber ? `Table ${myTeam.tableNumber}` : 'Floor Area'}</span>
                  <AvatarGroup isBordered size="sm" max={3} className="[&_*]:w-5 [&_*]:h-5 [&_*]:text-[8px] [&_*]:border-[var(--surface)]">
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
                <span className="text-[11px] text-[var(--accent)] font-medium">Click to form a team</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* 2. Venue Map */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/map')}
            className="commons-card p-5 h-full flex flex-col justify-between cursor-pointer hover:border-[var(--accent)] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--moss)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--moss)] group-hover:underline">
                  Open Map &rarr;
                </span>
              </div>
              <h3 className="font-heading text-base text-[var(--ink)] mb-1">
                Venue Floor Plan
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Locate your assigned table, presentation stages, mentor booths, and refreshments.
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Interactive GPS Enabled</span>
              <span className="font-mono text-[11px] font-medium text-[var(--ink)]">48 Tables</span>
            </div>
          </div>
        </motion.div>

        {/* 3. Resources & Notes */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/resources')}
            className="commons-card p-5 h-full flex flex-col justify-between cursor-pointer hover:border-[var(--accent)] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--sky)]">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--moss)] group-hover:underline">
                  Browse &rarr;
                </span>
              </div>
              <h3 className="font-heading text-base text-[var(--ink)] mb-1">
                Resources & APIs
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Shared starter repositories, API keys, documentation guides, and architecture references.
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--muted)]">
              <span>{resources.length} active documents</span>
              <span className="font-mono text-[11px] font-medium text-[var(--ink)]">{notes.length} Notes</span>
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
          <div className="commons-card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
              <div>
                <h2 className="font-heading text-base text-[var(--ink)]">Recent Team Notes</h2>
                <p className="text-xs text-[var(--muted)]">Collaborative ideas, questions, and architecture logs</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/notes')}
                  className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="py-12 text-center text-[var(--muted)] text-xs">
                No notes posted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {notes.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate('/notes')}
                    className="p-3.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--accent)] cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="font-heading text-sm text-[var(--ink)] line-clamp-1">{note.title}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] capitalize shrink-0">
                          {note.visibility}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                        {note.content}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[color-mix(in_srgb,var(--line)_50%,transparent)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span className="truncate">{note.author?.fullName ?? 'Author'}</span>
                      <span className="text-[var(--accent)] hover:underline font-medium">Read &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right 1 Col: Announcement & Teams Quick View */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          {/* Latest Announcement */}
          <div className="commons-card p-5 bg-[var(--surface)] border-l-3 border-l-[var(--accent)]">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[var(--accent)]">
              <Bell className="w-3.5 h-3.5" />
              <span>Announcement</span>
            </div>
            <h4 className="font-heading text-sm text-[var(--ink)] mb-1">
              Midway Architecture Review & Mentor Office Hours
            </h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Mentors are available at helpdesk booths. Pitch slide templates are ready in the resources section.
            </p>
          </div>

          {/* Active Teams on Floor */}
          <div className="commons-card p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-3">
                <h3 className="font-heading text-sm text-[var(--ink)]">Active Floor Teams</h3>
                <button
                  onClick={() => navigate('/teams')}
                  className="text-xs text-[var(--accent)] hover:underline font-medium"
                >
                  All ({teams.length})
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {teams.slice(0, 3).map((team) => (
                  <div
                    key={team.id}
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="p-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--accent)] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-[var(--ink)] truncate">{team.name}</p>
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        {team.tableNumber ? `Table ${team.tableNumber}` : 'Unassigned'}
                      </span>
                    </div>

                    <AvatarGroup isBordered size="sm" max={3} className="[&_*]:w-5 [&_*]:h-5 [&_*]:text-[8px] [&_*]:border-[var(--surface)] shrink-0">
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
              className="mt-3 w-full py-2 rounded-lg border border-dashed border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors text-center"
            >
              Browse all teams &rarr;
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
