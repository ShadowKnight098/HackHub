import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@heroui/react';
import { Mail, Save, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '@/types/enums';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

export const UserProfile: React.FC = () => {
  const { profile } = useAuth();
  const [role, setRole] = useState<UserRole>(profile?.role || UserRole.STUDENT);
  const [bio, setBio] = useState(profile?.bio || '');
  const [skillsInput, setSkillsInput] = useState(profile?.skills?.join(', ') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const updated = { ...profile, role, bio, skills };
    localStorage.setItem('hackhub_mock_profile', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!profile) return null;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="max-w-2xl mx-auto flex flex-col gap-6"
    >
      <div>
        <h1 className="text-3xl font-heading text-[var(--ink)]">Participant Profile</h1>
        <div className="title-rule" />
        <p className="text-sm text-[var(--muted)]">
          Manage your credentials, expertise tags, and platform authorization role.
        </p>
      </div>

      <div className="commons-card p-8 bg-[var(--surface)]">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Header Row */}
          <div className="flex items-center gap-5 pb-6 border-b border-[var(--line)]">
            <div className="relative">
              <Avatar
                size="lg"
                src={profile.avatarUrl || undefined}
                name={profile.fullName.slice(0, 2).toUpperCase()}
                className="w-16 h-16 text-lg font-heading font-bold border-2 border-[var(--sun)] bg-[color-mix(in_srgb,var(--sun)_18%,var(--surface))] text-[var(--ink)]"
              />
            </div>
            <div>
              <h2 className="font-heading text-xl text-[var(--ink)]">{profile.fullName}</h2>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>{profile.email}</span>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Platform Role / Authorization
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors cursor-pointer shadow-2xs"
                >
                  <option value={UserRole.STUDENT}>Student / Participant</option>
                  <option value={UserRole.FACULTY}>Faculty / Mentor</option>
                  <option value={UserRole.ADMIN}>Organizer / Admin (Grants Admin Dashboard Access)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Bio & Technical Focus
              </label>
              <textarea
                placeholder="Tell other hackers what you love to build..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors resize-y min-h-[80px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Skillset (comma separated)
              </label>
              <input
                type="text"
                placeholder="TypeScript, PyTorch, React, PostGIS, Rust"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-[var(--line)]">
            {saved ? (
              <span className="flex items-center gap-1.5 text-xs text-[var(--moss)] font-semibold">
                <Check className="w-4 h-4" /> Changes saved to session.
              </span>
            ) : (
              <span className="font-accent italic text-xs text-[var(--muted)]">
                Modifications update immediately.
              </span>
            )}

            <button
              type="submit"
              className="commons-btn-primary py-2 px-5 text-xs"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
