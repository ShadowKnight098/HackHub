import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Hash, User, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/enums';

export const RegisterForm: React.FC = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signUp, isSigningUp }     = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signUp({
        rollNumber: rollNumber.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: UserRole.STUDENT,
      });
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
        <div className="commons-card p-8 bg-[var(--surface)] rounded-[28px] shadow-2xl border border-[var(--line)]">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border border-[var(--accent)] text-[var(--ink)] font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Participant Registration</span>
            </div>
            <h1 className="font-heading text-2xl text-[var(--ink)]">Join the Cohort</h1>
            <div className="title-rule" />
            <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
              Create your participant profile with your roll number, full name, and password to join your team.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg p-3 text-xs border badge-visibility-private">
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--accent)]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* 1. Roll Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Roll Number <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <Hash className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. 22B81A0501 / CS-2026"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs font-mono"
                />
              </div>
            </div>

            {/* 2. Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Full Name <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Jordan Lee"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
                />
              </div>
            </div>

            {/* 3. Email Address */}
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

            {/* 4. Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Password <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  placeholder="Create your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
                />
              </div>
              <span className="text-[11px] text-[var(--muted)]">At least 6 characters</span>
            </div>

            <button
              type="submit"
              disabled={isSigningUp}
              className="commons-btn-primary mt-2 w-full py-2.5 text-sm cursor-pointer"
            >
              {isSigningUp ? 'Creating profile...' : 'Register Profile'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
            Already registered?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[var(--accent)] hover:underline font-semibold cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
