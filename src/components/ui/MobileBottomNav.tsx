import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Users,
  MapPin,
  MessageSquare,
  Pin,
} from 'lucide-react';
import { useAuth } from '@/features/auth';

interface MobileNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  isCenter?: boolean;
  badge?: string | number;
}

const NAV_ITEMS: MobileNavItem[] = [
  { id: 'home',  label: 'Home',  path: '/',      icon: Home },
  { id: 'teams', label: 'Teams', path: '/teams', icon: Users },
  { id: 'map',   label: 'Map',   path: '/map',   icon: MapPin, isCenter: true },
  { id: 'chat',  label: 'Chat',  path: '/chat',  icon: MessageSquare, badge: 3 },
  { id: 'notes', label: 'Notes', path: '/notes', icon: Pin },
];

export const MobileBottomNav: React.FC = () => {
  const { profile } = useAuth();

  // Only render on mobile if a participant profile is present
  if (!profile) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-40 select-none pointer-events-auto"
    >
      <div className="relative bg-[#191A23] text-white border-[1.5px] border-[#191A23] shadow-[0_6px_0_#000] rounded-full px-3 py-2 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `relative -top-5 flex flex-col items-center group transition-transform duration-200 active:scale-95 ${
                    isActive ? 'scale-105' : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Elevated Center Hero Circle */}
                    <div className="relative">
                      {/* Outer ring */}
                      <div className="w-14 h-14 rounded-full p-1 bg-[#FFFFFF] ring-4 ring-[#FFFFFF] shadow-[0_6px_0_#191A23] flex items-center justify-center transition-all duration-300">
                        <div
                          className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? 'bg-[#B9FF66] text-[#191A23] shadow-inner ring-2 ring-[#191A23]'
                              : 'bg-[#191A23] text-[#B9FF66] group-hover:bg-[#B9FF66] group-hover:text-[#191A23]'
                          }`}
                        >
                          <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      </div>

                      {/* Active indicator dot */}
                      {isActive && (
                        <motion.span
                          layoutId="activeCenterIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#B9FF66] ring-2 ring-[#191A23]"
                          transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                        />
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold tracking-tight mt-1 transition-colors duration-200 ${
                        isActive
                          ? 'text-[#B9FF66]'
                          : 'text-gray-400 group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex-1 py-1 flex flex-col items-center justify-center group relative transition-all duration-200 active:scale-95 ${
                  isActive ? 'text-[#B9FF66]' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? 'scale-110 stroke-[2.4] text-[#B9FF66]' : 'group-hover:scale-105 stroke-[1.8]'
                      }`}
                    />

                    {/* Badge count */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 rounded-full bg-[#B9FF66] text-[#191A23] text-[9px] font-bold flex items-center justify-center ring-2 ring-[#191A23] leading-none">
                        {item.badge}
                      </span>
                    )}

                    {/* Active pill background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBackground"
                        className="absolute inset--1.5 -z-10 rounded-full bg-white/10"
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      />
                    )}
                  </div>

                  <span
                    className={`text-[10px] tracking-tight mt-1 transition-colors duration-200 ${
                      isActive ? 'font-bold text-[#B9FF66]' : 'font-normal text-gray-400 group-hover:text-white'
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
