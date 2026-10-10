import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
} from '@heroui/react';
import { Check, X, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';
import { useTeams } from '../hooks/useTeams';
import type { TeamId } from '@/types/ids';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: TeamId;
  teamName: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
}) => {
  const { addTeamMember, isAddingMember } = useTeams();
  const [role, setRole] = useState<'member' | 'lead'>('member');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('HackHub@2026');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdd = async () => {
    if (!fullName.trim() || !email.trim()) return;
    setErrorMsg('');

    try {
      await addTeamMember({
        teamId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || 'HackHub@2026',
        role,
      });

      setFullName('');
      setEmail('');
      setPassword('HackHub@2026');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add collaborator');
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
              Add collaborator to {teamName}
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed mt-1.5">
              Add team members or co-leaders with their email and login credentials so they can join the workspace.
            </p>
          </div>

          {/* Pill Options: Role Selection */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2.5 block">
              Collaborator role:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all cursor-pointer border ${
                  role === 'member'
                    ? 'bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-[var(--accent)] text-[var(--ink)] font-semibold shadow-xs'
                    : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'
                }`}
              >
                {role === 'member' && (
                  <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <UserCheck className="w-3.5 h-3.5" />
                <span>Team Member</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('lead')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all cursor-pointer border ${
                  role === 'lead'
                    ? 'bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-[var(--accent)] text-[var(--ink)] font-semibold shadow-xs'
                    : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'
                }`}
              >
                {role === 'lead' && (
                  <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--moss)]" />
                <span>Team Lead / Co-Lead</span>
              </button>
            </div>
          </div>

          {/* Full Name Input */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Full name:
            </label>
            <input
              type="text"
              placeholder="e.g. Maya Chen"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Email address:
            </label>
            <input
              type="email"
              placeholder="e.g. maya@neuralcraft.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
            />
          </div>

          {/* Password Input (What to keep pass) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Password (what to keep):</span>
              </label>
              <button
                type="button"
                onClick={() => setPassword('HackHub@2026')}
                className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
              >
                Reset to default (HackHub@2026)
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. HackHub@2026"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm font-mono rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
            />
            <p className="text-[11px] text-[var(--muted)] mt-1.5">
              💡 <strong>Tip:</strong> Keep the default temporary password <code className="bg-[var(--bg)] px-1 py-0.5 rounded font-mono text-[var(--ink)]">HackHub@2026</code> so members can immediately sign in at the venue.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
              {errorMsg}
            </div>
          )}

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
              onClick={handleAdd}
              disabled={isAddingMember || !fullName.trim() || !email.trim()}
              className="px-7 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isAddingMember ? 'Adding...' : 'Add Collaborator'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
