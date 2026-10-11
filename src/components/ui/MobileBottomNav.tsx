import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  MapPin,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/features/auth';

interface MobileNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
}

const NAV_ITEMS: MobileNavItem[] = [
  { id: 'home',  label: 'Home',  path: '/',      icon: LayoutDashboard },
  { id: 'teams', label: 'Teams', path: '/teams', icon: Users },
  { id: 'map',   label: 'Map',   path: '/map',   icon: MapPin },
  { id: 'chat',  label: 'Chat',  path: '/chat',  icon: MessageSquare, badge: 3 },
  { id: 'notes', label: 'Notes', path: '/notes', icon: FileText },
];

export const MobileBottomNav: React.FC = () => {
  const { profile } = useAuth();

  // Only render on mobile if a participant profile is present
  if (!profile) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-3 left-4 right-4 max-w-sm mx-auto z-40 select-none pointer-events-auto"
    >
      <div className="relative bg-white/95 backdrop-blur-md text-slate-700 border border-slate-200/90 shadow-xl rounded-2xl px-2 py-1.5 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex-1 py-1.5 px-1 flex flex-col items-center justify-center group relative transition-all duration-150 rounded-xl ${
                  isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-150 ${
                        isActive ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />

                    {/* Badge count */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white leading-none">
                        {item.badge}
                      </span>
                    )}

                    {/* Active pill background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBackgroundMobile"
                        className="absolute -inset-1.5 -z-10 rounded-xl bg-indigo-50/80"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </div>

                  <span
                    className={`text-[10.5px] tracking-tight mt-1 transition-colors duration-150 ${
                      isActive ? 'font-semibold text-indigo-600' : 'font-medium text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
