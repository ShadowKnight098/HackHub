import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner, Avatar } from '@heroui/react';
import {
  Plus,
  Search,
  Users,
  X,
  MapPin,
  ExternalLink,
  Crown,
  ChevronRight,
  UserPlus,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useTeams } from '../hooks/useTeams';
import { CreateTeamModal } from './CreateTeamModal';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';
import type { Team } from '@/types/schemas/team';

const TRACK_CHIPS = ['All', 'AI/ML', 'Robotics', 'Web3', 'BioTech', 'Infra'];

export const TeamList: React.FC = () => {
  const { teams, isLoading, joinTeam, isJoining } = useTeams();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parse track from description or default to AI/ML
  const getTrack = (team: Team) => {
    if (!team.description) return 'General';
    const match = team.description.match(/^\[(.*?)\]/);
    if (match && match[1]) return match[1];
    if (team.description.toLowerCase().includes('robot')) return 'Robotics';
    if (team.description.toLowerCase().includes('web3') || team.description.toLowerCase().includes('chain')) return 'Web3';
    if (team.description.toLowerCase().includes('bio')) return 'BioTech';
    if (team.description.toLowerCase().includes('ai') || team.description.toLowerCase().includes('intelligence')) return 'AI/ML';
    return 'General';
  };

  const cleanPitch = (desc: string | null | undefined) => {
    if (!desc) return 'Collaborative hackathon project';
    return desc.replace(/^\[.*?\]\s*/, '');
  };

  const filtered = teams.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.tableNumber && t.tableNumber.toLowerCase().includes(search.toLowerCase()));

    const track = getTrack(t).toLowerCase();
    const matchesTrack =
      selectedTrack === 'All' ||
      track.includes(selectedTrack.toLowerCase()) ||
      (selectedTrack === 'AI/ML' && (track.includes('ai') || track.includes('ml')));

    return matchesSearch && matchesTrack;
  });

  const isUserInTeam = (team: Team) => {
    return Boolean(profile && team.members.some((m) => m.userId === profile.id));
  };

  return (
    <div className="flex flex-col gap-6 w-full select-none">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-[1.5px] border-[#191A23]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="tag-highlight text-[11px] font-mono uppercase">
              Cohort Directory
            </span>
            <span className="text-xs text-[#191A23] font-semibold">• {teams.length} Active Crews</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold text-[#191A23] tracking-tight">
            Team Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Explore student engineering groups, find teammates, or register your project crew.
          </p>
        </div>

        <button
          className="commons-btn-primary shrink-0 flex items-center gap-1.5"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Form New Team</span>
        </button>
      </div>

      {/* ── SEARCH & FILTER BAR ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search teams, pitch keywords, table numbers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-[14px] border-[1.5px] border-[#191A23] bg-white text-[#191A23] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#B9FF66] shadow-[0_2px_0_#191A23] font-mono"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#191A23] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {TRACK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedTrack(chip)}
              className={`px-3.5 py-2 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-[1.5px] border-[#191A23] ${
                selectedTrack === chip
                  ? 'bg-[#191A23] text-[#B9FF66] shadow-[0_3px_0_#191A23]'
                  : 'bg-white text-[#191A23] hover:bg-[#F3F3F3]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ── COMMAND MATRIX TERMINAL TABLE ───────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" color="primary" label="Querying matrix..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-[28px] border-[1.5px] border-dashed border-[#191A23] bg-[#F3F3F3]">
          <div className="w-12 h-12 rounded-2xl border-[1.5px] border-[#191A23] bg-white flex items-center justify-center mx-auto mb-3 shadow-[0_3px_0_#191A23]">
            <Users className="w-6 h-6 text-[#191A23]" />
          </div>
          <h3 className="font-heading text-lg font-bold text-[#191A23] mb-1">No matching teams</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            {search ? 'Try clearing filter criteria or search query.' : 'Be the first to register a new crew.'}
          </p>
        </div>
      ) : (
        <div className="w-full commons-card p-0 bg-white overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3.5 border-b-[1.5px] border-[#191A23] bg-[#F3F3F3] text-[11px] font-mono font-bold text-[#191A23] uppercase tracking-wider">
            <div className="col-span-1">Tag</div>
            <div className="col-span-3">Team / Project Name</div>
            <div className="col-span-2">Track Domain</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Members</div>
            <div className="col-span-1 text-center">Table</div>
            <div className="col-span-1 text-right">Inspect</div>
          </div>

          {/* Matrix Rows */}
          <div className="divide-y divide-[var(--line)]">
            {filtered.map((team) => {
              const track = getTrack(team);
              const isSelected = selectedTeam?.id === team.id;
              const isMember = isUserInTeam(team);
              const isLead = profile && team.members.some((m) => m.userId === profile.id && m.role === 'lead');
              const memberCount = team.members.length;
              const isRecruiting = memberCount < 4;

              return (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`group relative flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-3 px-4 sm:px-5 py-3.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] ring-1 ring-inset ring-[var(--accent)]/40'
                      : 'hover:bg-[var(--bg)]/50'
                  }`}
                >
                  {/* Tag / Monogram */}
                  <div className="hidden md:flex col-span-1 items-center">
                    <div className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center font-heading font-bold text-xs text-[var(--ink)] group-hover:border-[var(--accent)] transition-colors shadow-2xs">
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Project Name & Pitch */}
                  <div className="col-span-3 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="md:hidden w-7 h-7 rounded-md border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center font-heading font-bold text-[11px] text-[var(--ink)] shrink-0">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <h4 className="font-heading font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {team.name}
                      </h4>
                      {isLead && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          <Crown className="w-2.5 h-2.5" />
                          Lead
                        </span>
                      )}
                      {isMember && !isLead && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          Joined
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                      {cleanPitch(team.description)}
                    </p>
                  </div>

                  {/* Track Domain */}
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]">
                      {track}
                    </span>
                  </div>

                  {/* Status Pill */}
                  <div className="col-span-2 flex items-center">
                    {isRecruiting ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Recruiting
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Building
                      </span>
                    )}
                  </div>

                  {/* Members Stack */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {team.members.slice(0, 3).map((m, idx) => (
                        <Avatar
                          key={m.id || idx}
                          name={m.user?.fullName?.slice(0, 1) || 'U'}
                          src={m.user?.avatarUrl || undefined}
                          className="w-6 h-6 text-[9px] border-2 border-[var(--surface)] ring-1 ring-[var(--line)]"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-[var(--muted)]">
                      {memberCount}/4
                    </span>
                  </div>

                  {/* Table Location */}
                  <div className="col-span-1 flex items-center md:justify-center">
                    {team.tableNumber ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]">
                        <MapPin className="w-3 h-3 text-[var(--accent)]" />
                        {team.tableNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted)] font-mono">Floor</span>
                    )}
                  </div>

                  {/* Right Arrow / Inspector Trigger */}
                  <div className="hidden md:flex col-span-1 items-center justify-end">
                    <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── EXPANDABLE SLIDE-OUT SIDE INSPECTOR DRAWER ──────────────── */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTeam(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Inspector Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-md bg-[var(--surface)] border-l border-[var(--line)] h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10"
            >
              <div>
                {/* Panel Header */}
                <div className="p-6 pb-4 border-b border-[var(--line)] flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center font-heading font-bold text-base text-[var(--ink)] shadow-2xs">
                      {selectedTeam.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-[var(--ink)] leading-snug">
                        {selectedTeam.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-[var(--accent)] font-semibold">
                          {getTrack(selectedTeam)}
                        </span>
                        {selectedTeam.tableNumber && (
                          <>
                            <span className="text-[var(--muted)]">&bull;</span>
                            <span className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[var(--accent)]" />
                              Table {selectedTeam.tableNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Panel Body */}
                <div className="p-6 flex flex-col gap-6">
                  {/* Project Hypothesis / Pitch */}
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-2">
                      Project Hypothesis
                    </h4>
                    <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--line)]">
                      {cleanPitch(selectedTeam.description)}
                    </p>
                  </div>

                  {/* Crew Members */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                        Crew Roster ({selectedTeam.members.length}/4)
                      </h4>
                    </div>

                    <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden bg-[var(--bg)]/40">
                      {selectedTeam.members.map((member) => (
                        <div key={member.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              name={member.user?.fullName?.slice(0, 1) || 'U'}
                              src={member.user?.avatarUrl || undefined}
                              className="w-7 h-7 text-[10px] border border-[var(--line)] shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[var(--ink)] truncate">
                                {member.user?.fullName || 'Hacker Member'}
                              </p>
                              <p className="text-[10px] text-[var(--muted)] font-mono truncate">
                                {member.user?.email || ''}
                              </p>
                            </div>
                          </div>

                          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            member.role === 'lead'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                              : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]'
                          }`}>
                            {member.role === 'lead' ? 'Lead' : 'Member'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status / Recruiting slots */}
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-2">
                      Availability
                    </h4>
                    <div className="flex items-center gap-2">
                      {selectedTeam.members.length < 4 ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 w-full">
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>
                            {4 - selectedTeam.members.length} open slot{4 - selectedTeam.members.length > 1 ? 's' : ''} available in this crew
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium bg-zinc-500/10 px-3 py-2 rounded-xl border border-zinc-500/20 w-full">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Crew is currently at full capacity (4/4)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel Footer Actions */}
              <div className="p-6 border-t border-[var(--line)] bg-[var(--bg)]/50 flex flex-col gap-2">
                {isUserInTeam(selectedTeam) ? (
                  <button
                    onClick={() => navigate(`/teams/${selectedTeam.id}`)}
                    className="commons-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                  >
                    <span>Open Team Workspace</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (profile) {
                        joinTeam({ teamId: selectedTeam.id, userId: profile.id });
                        setSelectedTeam(null);
                      }
                    }}
                    disabled={isJoining || selectedTeam.members.length >= 4}
                    className="commons-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isJoining ? 'Joining Crew...' : 'Request to Join Team'}</span>
                  </button>
                )}

                <button
                  onClick={() => navigate(`/teams/${selectedTeam.id}`)}
                  className="commons-btn-secondary w-full py-2 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer"
                >
                  <span>View Full Profile</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--muted)]" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateTeamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
