import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/enums';

export const RegisterForm: React.FC = () => {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [fullName, setFullName]     = useState('');
  const [role, setRole]             = useState<UserRole>(UserRole.STUDENT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signUp, isSigningUp }     = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signUp({ email, password, fullName, role });
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err?.friendlyMessage ?? err?.message ?? 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen bg-ivory-grid flex items-center justify-center p-6 text-[var(--ink)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="commons-logo-mark">
            <span className="font-heading font-bold text-sm text-[var(--surface)]">H</span>
          </div>
          <div className="text-left">
            <p className="font-heading font-bold text-xl text-[var(--ink)] leading-none">HackHub</p>
            <p className="font-accent italic text-xs text-[var(--moss)]">Ivory & Burgundy</p>
          </div>
        </div>

        {/* Card */}
        <div className="commons-card p-8 bg-[var(--surface)]">
          <div className="mb-6">
            <h1 className="font-heading text-2xl text-[var(--ink)]">Join the Cohort</h1>
            <div className="title-rule" />
            <p className="text-xs text-[var(--muted)] mt-1">
              Create your profile to join project teams and access collaborative resources.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg p-3 text-xs border badge-visibility-private">
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--accent)]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Full Name <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Email address <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Password <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Role
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors cursor-pointer shadow-2xs"
                >
                  <option value={UserRole.STUDENT}>Student / Participant</option>
                  <option value={UserRole.FACULTY}>Faculty / Mentor</option>
                  <option value={UserRole.ADMIN}>Organizer / Admin</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSigningUp}
              className="commons-btn-primary mt-2 w-full py-2.5 text-sm"
            >
              {isSigningUp ? 'Creating profile...' : 'Register Profile'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
            Already registered?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[var(--accent)] hover:underline font-semibold"
            >
              Sign in
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
