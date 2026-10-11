import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn, isSigningIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signIn({
        email: email.trim().toLowerCase(),
        password: password.trim(),
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
        className="w-full max-w-md relative z-10"
      >
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="commons-logo-mark">
            <span className="font-heading font-bold text-sm text-white">H</span>
          </div>
          <div className="text-left">
            <p className="font-heading font-bold text-xl text-slate-900 leading-none">HackHub</p>
            <p className="text-xs text-slate-500 font-medium">Collaboration Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="commons-card p-7 sm:p-8 bg-white rounded-2xl shadow-xl border border-slate-200/90">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Participant Sign In</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-[26px] font-bold text-slate-900 leading-snug">
              Sign In to Workspace
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Enter your email address and password to access your team workspace.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl p-3 text-xs border badge-visibility-private">
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--accent)]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Address Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Email Address <span className="text-[var(--accent)]">*</span>
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

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--ink)]">
                Password <span className="text-[var(--accent)]">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="commons-btn-primary mt-2 w-full py-2.5 text-sm cursor-pointer"
            >
              {isSigningIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
            Don't have an account yet?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[var(--accent)] hover:underline font-semibold cursor-pointer"
            >
              Register here
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
