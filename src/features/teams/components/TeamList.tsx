import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';
import { Plus, Search, Users, X } from 'lucide-react';
import { useTeams } from '../hooks/useTeams';
import { TeamCard } from './TeamCard';
import { CreateTeamModal } from './CreateTeamModal';
import { useAuth } from '@/features/auth';

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

export const TeamList: React.FC = () => {
  const { teams, isLoading, joinTeam, isJoining } = useTeams();
  const { profile } = useAuth();
  const [search, setSearch]           = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
    (t.tableNumber  && t.tableNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* Page header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading text-[var(--ink)]">Hackathon Teams</h1>
          <div className="title-rule" />
          <p className="text-sm text-[var(--muted)]">
            Explore teams on the venue floor, request to join, or register your crew.
          </p>
        </div>
        <button
          className="commons-btn-primary shrink-0"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Form New Team</span>
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search teams by title, pitch, or table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" color="primary" label="Loading teams..." />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp}
          className="text-center py-20 rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)]"
        >
          <div className="w-12 h-12 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-[var(--muted)]" />
          </div>
          <h3 className="font-heading text-lg text-[var(--ink)] mb-1">No teams found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {search ? 'Try clearing your search terms to explore all active groups.' : 'Be the first to register a project team.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((team) => (
            <motion.div key={team.id} variants={fadeUp}>
              <TeamCard
                team={team}
                isJoining={isJoining}
                onJoin={() => { if (profile) joinTeam({ teamId: team.id, userId: profile.id }); }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <CreateTeamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
};
