import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  LogOut,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { Avatar } from '@heroui/react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/enums';

interface EditorialNavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Exactly matched names to the previous app navigation
const PRIMARY_LINKS = [
  { label: 'Dashboard',     path: '/',              sublabel: 'Metrics & prototype stream' },
  { label: 'Teams',         path: '/teams',         sublabel: 'Rosters, tables & projects' },
  { label: 'Resources',     path: '/resources',     sublabel: 'API specs, starters & files' },
  { label: 'Venue Map',     path: '/map',           sublabel: 'Floor plan, tables & live GPS' },
  { label: 'Notes',         path: '/notes',         sublabel: 'Team logs & architecture' },
  { label: 'Chat',          path: '/chat',          sublabel: 'Channels & mentors', badge: '3' },
  { label: 'Announcements', path: '/announcements', sublabel: 'Staff broadcasts' },
];

const SECONDARY_LINKS = [
  { label: 'DISCORD CHAT',    path: '/chat' },
  { label: 'MENTOR HELPDESK', path: '/map' },
  { label: 'API PLAYGROUND',  path: '/resources' },
  { label: 'STAFF BULLETIN',  path: '/announcements' },
];

export const EditorialNavOverlay: React.FC<EditorialNavOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-In Panel from Right Side */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl h-full flex flex-col justify-between bg-[#14161c] text-[#efeae0] border-l border-[#2e323d] shadow-2xl overflow-y-auto select-none z-10"
            style={{
              backgroundImage:
                'radial-gradient(color-mix(in srgb, #efeae0 6%, transparent) 1px, transparent 1.3px)',
              backgroundSize: '22px 22px',
            }}
          >
            {/* ── TOP HEADER (BRAND ON LEFT, CLOSE 'X' ON RIGHT) ──────── */}
            <div className="w-full flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[#2e323d]/70 bg-[#14161c]/90 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e3c27d] to-[#d4b06a] flex items-center justify-center text-[#14161c] font-bold text-xs shadow-md">
                  H
                </div>
                <div>
                  <span className="font-heading text-lg font-bold tracking-tight text-[#efeae0]">
                    HackHub
                  </span>
                  <span className="text-[11px] text-[#9a9ba5] ml-2 font-mono">
                    Navigation
                  </span>
                </div>
              </div>

              {/* Close Button on Right */}
              <button
                onClick={onClose}
                className="group flex items-center gap-2 p-1.5 rounded-lg text-[#9a9ba5] hover:text-[#efeae0] hover:bg-[#1c1f27] border border-transparent hover:border-[#2e323d] transition-all focus:outline-none"
                aria-label="Close navigation"
              >
                <span className="text-xs tracking-wider uppercase font-medium hidden sm:inline text-[#9a9ba5] group-hover:text-[#efeae0]">
                  Close
                </span>
                <div className="w-8 h-8 rounded-full border border-[#2e323d] group-hover:border-[#d98a9a] flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-[#efeae0] group-hover:rotate-90 transition-transform duration-200" />
                </div>
              </button>
            </div>

            {/* ── BODY (EDITORIAL SPLIT WITH MATCHED PREVIOUS NAMES) ──── */}
            <div className="flex-1 px-6 sm:px-10 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Primary Links Column (Matched Names) */}
              <div className="md:col-span-8 flex flex-col justify-center">
                <nav className="flex flex-col gap-1.5 sm:gap-2.5">
                  {PRIMARY_LINKS.map((item, index) => {
                    const isActive =
                      item.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.path);

                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * index, duration: 0.25 }}
                        className="group"
                      >
                        <button
                          onClick={() => handleNavigate(item.path)}
                          className="text-left w-full flex items-baseline justify-between py-1 transition-all"
                        >
                          <div className="flex items-baseline gap-3">
                            <span
                              className={`font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight transition-all duration-200 ${
                                isActive
                                  ? 'text-[#efeae0] translate-x-1'
                                  : 'text-[#9a9ba5]/50 group-hover:text-[#efeae0] group-hover:translate-x-1.5'
                              }`}
                            >
                              {item.label}
                            </span>

                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-[#d98a9a] inline-block animate-pulse shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7b2d3b]/40 text-[#d98a9a] border border-[#7b2d3b]">
                                {item.badge}
                              </span>
                            )}
                            <span className="hidden sm:inline font-accent italic text-xs text-[#9a9ba5]/60 group-hover:text-[#d4b06a] transition-colors">
                              {item.sublabel}
                            </span>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}

                  {/* Admin Panel (if applicable) */}
                  {profile?.role === UserRole.ADMIN && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group pt-2"
                    >
                      <button
                        onClick={() => handleNavigate('/admin')}
                        className="text-left w-full flex items-center justify-between py-1"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-[#d4b06a]" />
                          <span className="font-heading text-2xl sm:text-3xl font-bold text-[#d4b06a] group-hover:translate-x-1.5 transition-transform">
                            Admin Panel
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </nav>

                {/* Bottom Quick Call To Action */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="mt-8 pt-6 border-t border-[#2e323d]/60 flex items-center gap-3"
                >
                  <button
                    onClick={() => handleNavigate('/teams')}
                    className="group inline-flex items-center gap-2.5 text-sm sm:text-base font-heading text-[#efeae0] hover:text-[#d4b06a] transition-colors"
                  >
                    <span>Create or Join a Team</span>
                    <div className="w-6 h-6 rounded-full bg-[#2e323d] group-hover:bg-[#7b2d3b] flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 text-[#d98a9a] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              </div>

              {/* Right Secondary Column (Editorial Details) */}
              <div className="md:col-span-4 flex flex-col justify-start md:pl-6 md:border-l border-[#2e323d]/50">
                {/* Accent Dash (From Reference) */}
                <div className="w-8 h-1 bg-[#d98a9a] rounded-full mb-4" />

                <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#9a9ba5] mb-3">
                  SHORTCUTS
                </p>

                <div className="flex flex-col gap-2.5 w-full">
                  {SECONDARY_LINKS.map((sec) => (
                    <button
                      key={sec.label}
                      onClick={() => handleNavigate(sec.path)}
                      className="text-left py-1 group"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase font-medium text-[#9a9ba5] group-hover:text-[#efeae0] transition-colors">
                        {sec.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Live Hackathon Widget */}
                <div className="mt-6 p-3.5 rounded-lg border border-[#2e323d] bg-[#1c1f27]">
                  <div className="flex items-center gap-1.5 text-xs text-[#d4b06a] font-semibold mb-1">
                    <Radio className="w-3 h-3 text-[#d98a9a] animate-pulse" />
                    <span>Cohort Status</span>
                  </div>
                  <p className="text-[11px] text-[#9a9ba5] leading-relaxed">
                    26h left • Tables 1–48 online. Mentors active at Helpdesk.
                  </p>
                </div>
              </div>
            </div>

            {/* ── BOTTOM PROFILE FOOTER ───────────────────────────────── */}
            <div className="w-full px-6 sm:px-10 py-4 border-t border-[#2e323d]/70 bg-[#14161c]/90 backdrop-blur-md flex items-center justify-between gap-4">
              {profile ? (
                <div className="flex items-center gap-2.5">
                  <Avatar
                    size="sm"
                    src={profile.avatarUrl || undefined}
                    name={profile.fullName.slice(0, 2).toUpperCase()}
                    className="w-7 h-7 border border-[#2e323d] bg-[#1c1f27] text-[#efeae0] text-[10px]"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[#efeae0] leading-tight">
                      {profile.fullName}
                    </p>
                    <p className="text-[10px] text-[#9a9ba5] capitalize leading-tight">
                      {profile.role}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#9a9ba5]">Guest Participant</span>
              )}

              <div className="flex items-center gap-3">
                {profile && (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-xs text-[#9a9ba5] hover:text-[#d98a9a] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
