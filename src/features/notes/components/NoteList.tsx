import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';
import { Plus, Search, FileText, X } from 'lucide-react';
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
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading text-[var(--ink)]">Collaborative Sticky Notes</h1>
          <div className="title-rule" />
          <p className="text-sm text-[var(--muted)]">
            Architectural standup records, hypothesis notes, and inline feedback.
          </p>
        </div>

        <button
          className="commons-btn-primary shrink-0"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Pin New Note</span>
        </button>
      </motion.div>

      {/* Filter / Search */}
      <motion.div variants={fadeUp} className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search note annotations or text..."
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
          <Spinner size="lg" label="Loading notes..." color="primary" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="text-center py-20 rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)]"
        >
          <div className="w-12 h-12 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-[var(--muted)]" />
          </div>
          <h3 className="font-heading text-lg text-[var(--ink)] mb-1">No notes recorded</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {search ? 'Try adjusting your search query.' : 'Pin the first team note to start documenting.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
