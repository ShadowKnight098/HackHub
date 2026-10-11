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
  Zap,
  Camera,
} from 'lucide-react';
import { Avatar, AvatarGroup } from '@heroui/react';
import { useAuth } from '@/features/auth';
import { useTeams } from '@/features/teams';
import { useResources } from '@/features/resources';
import { useNotes } from '@/features/notes';
import { HeroPhotoBanner } from './HeroPhotoBanner';

const HOURS_LEFT = 26;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { teams = [] } = useTeams();
  const { resources = [] } = useResources();
  const { notes = [] } = useNotes();

  const myTeam = profile
    ? teams.find((t) => Array.isArray(t.members) && t.members.some((m) => m?.userId === profile.id))
    : null;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16 w-full max-w-full overflow-x-hidden">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 0: QUICK ANCHOR JUMP BAR & LIVE STATUS TICKER ─────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline shrink-0">
            Jump to:
          </span>
          <a
            href="#hero-banner"
            className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition-all flex items-center gap-1 shrink-0"
          >
            <Camera className="w-3 h-3 text-indigo-500" />
            <span>Photos</span>
          </a>
          <a
            href="#telemetry"
            className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition-all flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Telemetry</span>
          </a>
          <a
            href="#workspaces"
            className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition-all flex items-center gap-1 shrink-0"
          >
            <FolderGit2 className="w-3 h-3 text-emerald-500" />
            <span>Portals</span>
          </a>
          <a
            href="#night-arena"
            className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 shadow-2xs transition-all flex items-center gap-1 shrink-0"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Night Arena</span>
          </a>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Cohort 2026 • 26h Left</span>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TOP HERO BANNER: DYNAMIC PHOTO SHOWCASE (ZERO HARDCODED MOCKS) ────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <HeroPhotoBanner />

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 1: THE ALABASTER LIGHT ZONE (STUDIO TELEMETRY) ────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <section id="telemetry" className="flex flex-col gap-5 sm:gap-6">
        {/* ── HERO WELCOME & SPRINT COMMAND CARD ───────────────────────────── */}
        <div className="p-4 sm:p-8 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Academic Session 2026</span>
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{HOURS_LEFT} Hours Remaining</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">
              Welcome back, {profile?.fullName?.split(' ')[0] ?? 'Builder'}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Your command center for sprint milestones, mentor booths, live table telemetry, and real-time project collaboration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {myTeam ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="commons-btn-primary shadow-xs text-xs sm:text-sm"
                onClick={() => navigate(`/teams/${myTeam.id}`)}
              >
                <span>My Team: {myTeam.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="commons-btn-primary shadow-xs text-xs sm:text-sm"
                onClick={() => navigate('/teams')}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Join or Create Team</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="commons-btn-secondary text-xs sm:text-sm"
              onClick={() => navigate('/map')}
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Floor Plan</span>
            </motion.button>
          </div>
        </div>

        {/* ── QUICK TELEMETRY METRIC CARDS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Teams Metric */}
          <div
            onClick={() => navigate('/teams')}
            className="p-3.5 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-3 sm:gap-4 min-w-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">Active Teams</p>
              <p className="text-lg sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">
                {teams.length}
              </p>
            </div>
          </div>

          {/* Resources Metric */}
          <div
            onClick={() => navigate('/resources')}
            className="p-3.5 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-3 sm:gap-4 min-w-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">Shared Resources</p>
              <p className="text-lg sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">
                {resources.length}
              </p>
            </div>
          </div>

          {/* Venue Tables Metric */}
          <div
            onClick={() => navigate('/map')}
            className="p-3.5 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-3 sm:gap-4 min-w-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-50 border border-sky-100/80 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">Floor Tables</p>
              <p className="text-lg sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">
                48 Pins
              </p>
            </div>
          </div>

          {/* Faculty Supervision Metric */}
          <div
            onClick={() => navigate('/faculty')}
            className="p-3.5 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex items-center gap-3 sm:gap-4 min-w-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">Faculty Hub</p>
              <p className="text-lg sm:text-2xl font-heading font-bold text-slate-900 mt-0.5">
                Active
              </p>
            </div>
          </div>
        </div>

        {/* ── 3 CORE FEATURE HIGHLIGHT PORTALS ─────────────────────────────── */}
        <div id="workspaces" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* 1. Team Project Workspace */}
          <div
            onClick={() => (myTeam ? navigate(`/teams/${myTeam.id}`) : navigate('/teams'))}
            className="p-4 sm:p-6 h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  <Users className="w-3.5 h-3.5" />
                  <span>Team Workspace</span>
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shadow-2xs">
                  <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {myTeam ? myTeam.name : 'No Team Assigned'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {myTeam
                  ? myTeam.description || `Stationed at ${myTeam.tableNumber ? `Table ${myTeam.tableNumber}` : 'the main venue floor'}.`
                  : 'Join an existing engineering crew or register your project group.'}
              </p>
            </div>

            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              {myTeam ? (
                <>
                  <span className="font-mono text-[11px] sm:text-xs font-semibold text-slate-700">
                    {myTeam.tableNumber ? `Table ${myTeam.tableNumber}` : 'Floor Area'}
                  </span>
                  <AvatarGroup isBordered size="sm" max={3} className="[&_*]:w-6 [&_*]:h-6 [&_*]:text-[9px] [&_*]:border-white">
                    {Array.isArray(myTeam.members) &&
                      myTeam.members.map((m) => (
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

          {/* 2. Venue Map */}
          <div
            onClick={() => navigate('/map')}
            className="p-4 sm:p-6 h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Interactive Map</span>
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 transition-colors shadow-2xs">
                  <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
                Venue Floor Navigation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Locate assigned table numbers, presentation stages, mentor booths, and snack stations with real-time floor coordinates.
              </p>
            </div>

            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Interactive Floor GPS</span>
              <span className="font-mono text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                48 Tables
              </span>
            </div>
          </div>

          {/* 3. Resources & Starter APIs */}
          <div
            onClick={() => navigate('/resources')}
            className="p-4 sm:p-6 h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>Resource Hub</span>
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors shadow-2xs">
                  <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
                </div>
              </div>

              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                APIs & Documentation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Shared starter boilerplate, partner sponsor API keys, pitch slide assets, and architecture references.
              </p>
            </div>

            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>{resources.length} active documents</span>
              <span className="font-mono text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {notes.length} Notes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 2: THE MATTE OBSIDIAN NIGHT ZONE (ZERO EYE-STRAIN DARK HALF) ─ */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <section
        id="night-arena"
        className="relative rounded-3xl bg-[#0B0D14] text-slate-100 border border-slate-800/80 p-4 sm:p-8 lg:p-10 shadow-2xl overflow-hidden flex flex-col gap-6 sm:gap-8"
      >
        {/* Subtle Ambient Night Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/10 rounded-full blur-3xl pointer-events-none -z-0" />

        {/* ── SECTION HEADER & LIVE STATUS RIBBON ───────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-white/10 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live Operations & Creative Floor</span>
              </span>
              <span className="text-xs font-mono text-slate-400 hidden md:inline">
                Real-Time Cohort Telemetry
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-heading font-bold text-white tracking-tight">
              Community Hub & Crew Collaboration
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time engineering notes, sprint logs, floor broadcasts, and cohort workstations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Night Mode Arena</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>

        {/* ── COLLABORATIVE NOTES & LIVE COHORT TEAMS (DARK GLASS) ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 relative z-10">
          {/* Left 2 Columns: Collaborative Team Notes */}
          <div className="lg:col-span-2">
            <div className="p-4 sm:p-6 bg-[#121522] border border-white/10 rounded-2xl shadow-xl h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 mb-4 sm:mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm sm:text-base font-bold text-white">
                      Collaborative Team Notes
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Engineering logs, hypothesis annotations, and sprint feedback
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/notes')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group cursor-pointer transition-colors"
                >
                  View all <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No notes posted yet. Click to record the first architectural note!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 flex-1">
                  {notes.slice(0, 4).map((note) => (
                    <div
                      key={note.id}
                      onClick={() => navigate('/notes')}
                      className="p-3.5 sm:p-4 rounded-xl border border-white/10 bg-[#161927] hover:border-indigo-500/50 hover:bg-[#1a1e2f] cursor-pointer transition-all flex flex-col justify-between group shadow-lg"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-100 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                            {note.title}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-300 font-semibold capitalize shrink-0">
                            {note.visibility}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {note.content}
                        </p>
                      </div>

                      <div className="pt-2 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate font-medium">{note.author?.fullName ?? 'Author'}</span>
                        <span className="font-semibold text-indigo-400 group-hover:underline">Read &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Column: Announcement & Active Teams on Floor */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Latest Announcement Bulletin Card (Dark Glass) */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-[#161A2A] to-[#121422] border border-indigo-500/20 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-indigo-600 text-white font-semibold shadow-xs">
                  <Bell className="w-3 h-3" />
                  <span>Broadcast Notice</span>
                </span>
              </div>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-white mb-1">
                Midway Architecture Review & Mentor Hours
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Technical mentors are active at booths. Pitch slide deck guidelines and evaluation criteria are ready in the resources section.
              </p>
            </div>

            {/* Active Teams on Venue Floor (Dark Glass) */}
            <div className="p-4 sm:p-5 bg-[#121522] border border-white/10 rounded-2xl shadow-xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-white/10 mb-3">
                  <span className="font-heading text-xs sm:text-sm font-bold text-white">
                    Active Floor Crews
                  </span>
                  <button
                    onClick={() => navigate('/teams')}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    All ({teams.length})
                  </button>
                </div>

                <div className="flex flex-col gap-2 sm:gap-2.5">
                  {teams.slice(0, 3).map((team) => (
                    <div
                      key={team.id}
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="p-2.5 sm:p-3 rounded-xl border border-white/10 bg-[#161927] hover:bg-[#1a1e2f] hover:border-white/20 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-100 truncate">{team.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {team.tableNumber ? `Table ${team.tableNumber}` : 'Venue Floor'}
                        </span>
                      </div>

                      <AvatarGroup isBordered size="sm" max={3} className="[&_*]:w-5 [&_*]:h-5 sm:[&_*]:w-6 sm:[&_*]:h-6 [&_*]:text-[8px] [&_*]:border-slate-800 shrink-0">
                        {Array.isArray(team.members) &&
                          team.members.map((m) => (
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
                className="mt-3.5 sm:mt-4 w-full py-2 px-3 text-xs font-semibold rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Browse all crew tables</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
