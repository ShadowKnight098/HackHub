import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowRight,
  Plus,
  Bell,
  ChevronRight,
  Users,
  GraduationCap,
  FolderGit2,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Avatar, AvatarGroup } from '@heroui/react';
import { useAuth } from '@/features/auth';
import { useTeams } from '@/features/teams';
import { useResources } from '@/features/resources';
import { useNotes } from '@/features/notes';
import { SharedPhotoGallery } from './SharedPhotoGallery';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
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
      {/* ── HERO BANNER & WELCOME ────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="commons-card p-6 sm:p-8 bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Academic Session 2026</span>
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{HOURS_LEFT} Hours Remaining</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">
            Welcome back, {profile?.fullName?.split(' ')[0] ?? 'Builder'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Your unified workspace for team collaboration, mentor helpdesks, interactive venue navigation, and faculty project milestone tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
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
              <Plus className="w-4 h-4" />
              <span>Join or Create Team</span>
            </button>
          )}

          <button
            className="commons-btn-secondary"
            onClick={() => navigate('/map')}
          >
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>Floor Plan</span>
          </button>
        </div>
      </motion.div>

      {/* ── QUICK TELEMETRY METRIC WIDGETS ───────────────────────────────── */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Teams Metric */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/teams')}
            className="commons-card p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Active Teams</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">
                {teams.length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Resources Metric */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/resources')}
            className="commons-card p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Shared Resources</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">
                {resources.length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Venue Tables Metric */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/map')}
            className="commons-card p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Floor Tables</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">
                48 Pins
              </p>
            </div>
          </div>
        </motion.div>

        {/* Faculty Supervision Metric */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/faculty')}
            className="commons-card p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Faculty Hub</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">
                Active
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── PHOTO GALLERY SECTION ────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <SharedPhotoGallery isDarkMode={false} />
      </motion.div>

      {/* ── 3 CORE FEATURE HIGHLIGHT CARDS ───────────────────────────────── */}
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Team Project Workspace */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => (myTeam ? navigate(`/teams/${myTeam.id}`) : navigate('/teams'))}
            className="commons-card p-6 h-full bg-white hover:bg-slate-50/70 flex flex-col justify-between cursor-pointer group border border-slate-200/90 shadow-sm hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Users className="w-3.5 h-3.5" />
                  <span>Team Workspace</span>
                </span>
                <div className="btn-circle-arrow">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-lg font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                {myTeam ? myTeam.name : 'No Team Assigned'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {myTeam
                  ? myTeam.description || `Active at ${myTeam.tableNumber ? `Table ${myTeam.tableNumber}` : 'the main venue floor'}.`
                  : 'Join an existing engineering crew or register your project group.'}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              {myTeam ? (
                <>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {myTeam.tableNumber ? `Table ${myTeam.tableNumber}` : 'Floor Area'}
                  </span>
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
                <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
                  Click to join or create &rarr;
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* 2. Venue Map */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/map')}
            className="commons-card p-6 h-full bg-white hover:bg-slate-50/70 flex flex-col justify-between cursor-pointer group border border-slate-200/90 shadow-sm hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Interactive Map</span>
                </span>
                <div className="btn-circle-arrow">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-lg font-bold text-slate-900 mb-1.5 group-hover:text-sky-600 transition-colors">
                Venue Navigation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Locate your assigned table, presentation stages, mentor helpdesks, and amenities with real-time floor coordinates.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Interactive GPS</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                48 Tables
              </span>
            </div>
          </div>
        </motion.div>

        {/* 3. Resources & Starter APIs */}
        <motion.div variants={fadeUp}>
          <div
            onClick={() => navigate('/resources')}
            className="commons-card p-6 h-full bg-white hover:bg-slate-50/70 flex flex-col justify-between cursor-pointer group border border-slate-200/90 shadow-sm hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>Resource Hub</span>
                </span>
                <div className="btn-circle-arrow">
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-lg font-bold text-slate-900 mb-1.5 group-hover:text-emerald-600 transition-colors">
                APIs & Documentation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Shared starter templates, partner sponsor API keys, pitch slide assets, and architecture references.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>{resources.length} active documents</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {notes.length} Notes
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── NOTES & ANNOUNCEMENTS SECTION ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Collaborative Notes */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="commons-card p-6 bg-white border border-slate-200/90 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">
                    Collaborative Notes
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ideas, architecture logs, and quick team references
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/notes')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group cursor-pointer"
              >
                View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No notes posted yet. Click to create the first note!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {notes.slice(0, 4).map((note, index) => {
                  const tintClass = index % 3 === 0 ? 'note-tint-1' : index % 3 === 1 ? 'note-tint-2' : 'note-tint-3';
                  return (
                    <div
                      key={note.id}
                      onClick={() => navigate('/notes')}
                      className={`p-4 rounded-xl border ${tintClass} hover:shadow-md cursor-pointer transition-all flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-heading font-bold text-sm text-slate-900 line-clamp-1">
                            {note.title}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/80 text-slate-700 font-semibold capitalize shrink-0">
                            {note.visibility}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {note.content}
                        </p>
                      </div>

                      <div className="pt-2.5 mt-3 border-t border-slate-900/10 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate font-medium">{note.author?.fullName ?? 'Author'}</span>
                        <span className="font-semibold text-indigo-700 group-hover:underline">Read &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right 1 Col: Announcement & Active Teams */}
        <motion.div variants={fadeUp} className="flex flex-col gap-5">
          {/* Latest Announcement Card */}
          <div className="commons-card p-5 bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-indigo-600 text-white font-semibold">
                <Bell className="w-3 h-3" />
                <span>Notice</span>
              </span>
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900 mb-1.5">
              Midway Architecture Review & Mentor Hours
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mentors are available at helpdesk booths. Pitch slide templates are ready in the resources section.
            </p>
          </div>

          {/* Active Teams Quick View */}
          <div className="commons-card p-5 bg-white border border-slate-200/90 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                <span className="font-heading text-sm font-bold text-slate-900">
                  Active Teams
                </span>
                <button
                  onClick={() => navigate('/teams')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  All ({teams.length})
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {teams.slice(0, 3).map((team) => (
                  <div
                    key={team.id}
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{team.name}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
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
