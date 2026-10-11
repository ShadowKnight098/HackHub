import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Users,
  GraduationCap,
  FolderGit2,
  MapPin,
  FileText,
  MessageSquare,
  Bell,
  ShieldAlert,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { UserRole } from '@/types/enums';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATIC_PAGES = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, category: 'Pages' },
  { label: 'Team Directory', path: '/teams', icon: Users, category: 'Pages' },
  { label: 'Faculty Hub', path: '/faculty', icon: GraduationCap, category: 'Pages' },
  { label: 'Venue & Floor Map', path: '/map', icon: MapPin, category: 'Pages' },
  { label: 'Resource Hub', path: '/resources', icon: FolderGit2, category: 'Pages' },
  { label: 'Collaborative Notes', path: '/notes', icon: FileText, category: 'Pages' },
  { label: 'Chat & Mentors', path: '/chat', icon: MessageSquare, category: 'Pages' },
  { label: 'Announcements & Bulletins', path: '/announcements', icon: Bell, category: 'Pages' },
];

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { teams } = useTeams();

  // Close on Escape, focus input on open
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

  if (!isOpen) return null;

  const filteredPages = STATIC_PAGES.filter((p) =>
    p.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTeams = teams
    .filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(query.toLowerCase())) ||
      (t.tableNumber && t.tableNumber.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 5);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
        >
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, teams, table numbers, resources..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Results list */}
          <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1">
            {/* Pages Section */}
            {filteredPages.length > 0 && (
              <div className="py-1">
                <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pages & Navigation
                </p>
                {filteredPages.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-600 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 text-slate-600 flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Teams Section (if query matches) */}
            {filteredTeams.length > 0 && (
              <div className="py-1 border-t border-slate-100">
                <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Teams & Tables
                </p>
                {filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSelect(`/teams/${team.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-600 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 truncate">
                          {team.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {team.tableNumber ? `Table ${team.tableNumber}` : 'Main Floor'} • {team.members.length} members
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Admin link if user is admin */}
            {profile?.role === UserRole.ADMIN && (
              <div className="py-1 border-t border-slate-100">
                <button
                  onClick={() => handleSelect('/admin')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Organizer & Admin Console</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-all" />
                </button>
              </div>
            )}

            {filteredPages.length === 0 && filteredTeams.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No matching results found</p>
                <p className="text-xs text-slate-400 mt-1">Try searching for teams, tables, or topics</p>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Navigation quick jump</span>
            <span className="font-mono text-[11px]">↑↓ to navigate • ↵ to select</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
