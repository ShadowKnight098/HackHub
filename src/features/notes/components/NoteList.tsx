import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';
import { Plus, Search, X } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { NoteCard } from './NoteCard';
import { CreateNoteModal } from './CreateNoteModal';

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

export const NoteList: React.FC = () => {
  const { notes, isLoading } = useNotes();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* Header - Optimized for mobile & desktop */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[var(--ink)] tracking-tight">
            Notes
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-[var(--muted)] mt-0.5">
            Architectural standup records, hypothesis notes, and inline feedback.
          </p>
        </div>

        <button
          className="commons-btn-primary shrink-0 py-2 sm:py-2.5 px-4 text-xs sm:text-sm font-semibold flex items-center gap-1.5"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Pin New Note</span>
        </button>
      </motion.div>

      {/* Filter / Search Bar with Pill/Rounded Design */}
      <motion.div variants={fadeUp} className="w-full">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search note annotations or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" label="Loading notes..." color="primary" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center text-center py-20 px-4 min-h-[340px] rounded-2xl border border-dashed border-[var(--line)]/70 bg-[var(--surface)]/50"
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg
              className="w-7 h-7 text-[var(--muted)] -rotate-45"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          </div>
          <p className="text-sm sm:text-base font-medium text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
            {search ? 'No notes match your search query.' : 'No notes recorded \u2013 pin the first team note to start documenting.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-20 md:pb-6">
          {filteredNotes.map((note, idx) => (
            <motion.div key={note.id} variants={fadeUp}>
              <NoteCard note={note} index={idx} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <CreateNoteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
};
