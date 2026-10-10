import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Hash, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('HackHub@2026');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn, isSigningIn }     = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signIn({
        email: email.trim().toLowerCase(),
        password: password.trim() || 'HackHub@2026',
        fullName: fullName.trim(),
        rollNumber: rollNumber.trim(),
      });
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err?.friendlyMessage ?? err?.message ?? 'Failed to sign in');
    }
  };

  return (
    <div className="min-h-screen bg-ivory-grid flex items-center justify-center p-6 text-[var(--ink)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-lg relative z-10"
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
        <div className="commons-card p-8 sm:p-9 bg-[var(--surface)] rounded-[28px] shadow-2xl border border-[var(--line)]">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border border-[var(--accent)] text-[var(--ink)] font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Participant Check-In</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-[26px] font-bold text-[var(--ink)] leading-snug">
              Sign In to Workspace
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
              Enter your student roll number, full name, and email. The hackathon access password is pre-filled.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl p-3 text-xs border badge-visibility-private">
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--accent)]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Roll Number Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Roll Number / Student ID <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <Hash className="w-4 h-4 text-[var(--muted)] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. 21BCE0492 / CS-2026"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs font-mono"
                />
              </div>
            </div>

            {/* Full Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Full Name <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[var(--muted)] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera / Maya Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Email Address Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Email Address <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[var(--muted)] absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  placeholder="e.g. alex@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Input (Pre-filled with HackHub@2026) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--ink)]">
                  Hackathon Password <span className="text-[var(--accent)]">*</span>
                </label>
                <span className="text-[11px] text-[var(--muted)]">Pre-filled default</span>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[var(--muted)] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="HackHub@2026"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 text-sm font-mono rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSigningIn || !email.trim() || !fullName.trim() || !rollNumber.trim()}
              className="commons-btn-primary mt-2 w-full py-3 text-sm font-semibold rounded-2xl shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSigningIn ? 'Verifying & Signing In...' : 'Sign In to Workspace'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
            Need to register a fresh profile?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[var(--accent)] hover:underline font-semibold cursor-pointer"
            >
              Participant Registration
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
