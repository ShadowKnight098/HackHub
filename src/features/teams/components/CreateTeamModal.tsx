import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
} from '@heroui/react';
import { useAuth } from '@/features/auth';
import { useTeams } from '../hooks/useTeams';
import { Check, X } from 'lucide-react';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRACKS = [
  'AI & Intelligent Systems',
  'Web3 & Distributed',
  'Robotics & Hardware',
  'BioTech & Health',
  'Developer Infrastructure',
];

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose }) => {
  const [selectedTrack, setSelectedTrack] = useState('AI & Intelligent Systems');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const { profile } = useAuth();
  const { createTeam, isCreating } = useTeams();

  const handleCreate = async () => {
    if (!name.trim()) return;

    const authorId = (profile?.id || '80bb5377-7cf9-49e2-b8d7-254193c7a16c') as any;
    const finalDescription = description.trim()
      ? `[${selectedTrack}] ${description.trim()}`
      : `[${selectedTrack}] Collaborative project`;

    try {
      await createTeam({
        input: {
          hackathonId: '466eebd5-875f-423b-b1f1-10b93bebccf6',
          name: name.trim(),
          description: finalDescription,
          tableNumber: tableNumber.trim() || undefined,
        },
        userId: authorId,
      });
      setName('');
      setDescription('');
      setTableNumber('');
      onClose();
    } catch (err) {
      console.error('Failed to create team', err);
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
                className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors p-1 -mr-1"
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
              What kind of team do you want to form?
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed mt-1.5">
              Tell us what domain and problem space your team will explore so organizers and hackers can collaborate.
            </p>
          </div>

          {/* Pill Options: Project Track */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2.5 block">
              Challenge track:
            </label>
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((track) => {
                const isSelected = selectedTrack === track;
                return (
                  <button
                    key={track}
                    type="button"
                    onClick={() => setSelectedTrack(track)}
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
                    <span>{track}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Name Input */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Team name:
            </label>
            <input
              type="text"
              placeholder="e.g. NeuralCraft / Pixel Pioneers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
            />
          </div>

          {/* Abstract / Mission Textarea */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Project abstract & mission:
            </label>
            <textarea
              placeholder="What core problem or challenge will your team explore?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-y min-h-[88px] shadow-2xs"
            />
          </div>

          {/* Assigned Table Input */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Assigned venue table (optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Table A-12"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
            />
          </div>

          {/* Bottom Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] hover:bg-[color-mix(in_srgb,var(--line)_50%,var(--bg))] text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              className="px-7 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isCreating ? 'Registering...' : 'Next'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
