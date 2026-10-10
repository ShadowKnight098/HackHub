import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
} from '@heroui/react';
import { Check, X, Pin } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useNotes } from '../hooks/useNotes';
import { Visibility } from '@/types/enums';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VISIBILITY_OPTIONS = [
  { value: Visibility.TEAM, label: 'Team Only' },
  { value: Visibility.HACKATHON, label: 'Hackathon Wide' },
  { value: Visibility.PUBLIC, label: 'Public' },
  { value: Visibility.PRIVATE, label: 'Private (Author Only)' },
];

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { createNote, isCreating } = useNotes();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(Visibility.TEAM);
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const authorId = (profile?.id || '80bb5377-7cf9-49e2-b8d7-254193c7a16c') as any;

    try {
      await createNote({
        input: {
          hackathonId: '466eebd5-875f-423b-b1f1-10b93bebccf6',
          title: title.trim(),
          content: content.trim(),
          visibility,
          isPinned,
        },
        authorId,
      });

      setTitle('');
      setContent('');
      setIsPinned(false);
      onClose();
    } catch (err) {
      console.error('Failed to create note', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="blur"
      size="xl"
      hideCloseButton
      classNames={{
        base: 'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl rounded-[28px] overflow-hidden',
      }}
    >
      <ModalContent>
        <ModalBody className="p-8 sm:p-9 flex flex-col gap-6">
          {/* Top Progress & Step Indicator */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-semibold text-[var(--muted)]">
              <span>Step 1/2</span>
              <button
                onClick={onClose}
                className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors p-1 -mr-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full h-1 bg-[var(--line)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent)] rounded-full w-3/5 transition-all duration-300" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div>
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[var(--ink)] leading-snug">
              Draft a collaborative note
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed mt-1.5">
              Document architectural decisions, sprint goals, code snippets, or team research notes.
            </p>
          </div>

          {/* Pill Options: Visibility Access */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2.5 block">
              Visibility audience:
            </label>
            <div className="flex flex-wrap gap-2">
              {VISIBILITY_OPTIONS.map((opt) => {
                const isSelected = visibility === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-[var(--accent)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {isSelected && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Title Input */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Note title:
            </label>
            <input
              type="text"
              placeholder="e.g. Sprint Goals / State Machine Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Markdown / annotation content:
            </label>
            <textarea
              placeholder="Document notes, tasks, code snippets, or architectural decisions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-sm font-body rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-y min-h-[110px] shadow-2xs"
            />
          </div>

          {/* Pin to workspace toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50">
            <div className="flex items-center gap-2.5">
              <Pin className="w-4 h-4 text-[var(--accent)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--ink)]">Pin to workspace header</p>
                <p className="text-[11px] text-[var(--muted)]">Keep this note prominently visible to all teammates</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] hover:bg-[color-mix(in_srgb,var(--line)_50%,var(--bg))] text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCreating || !title.trim()}
              className="px-7 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isCreating ? 'Publishing...' : 'Next'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
