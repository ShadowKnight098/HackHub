import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar, Tooltip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FolderGit2,
  MapPin,
  FileText,
  MessageSquare,
  Bell,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/enums';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  category?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: '/',             icon: LayoutDashboard, category: 'Main' },
  { label: 'Teams',         path: '/teams',         icon: Users,           category: 'Main' },
  { label: 'Faculty Hub',   path: '/faculty',      icon: GraduationCap,   category: 'Main' },
  { label: 'Venue Map',     path: '/map',           icon: MapPin,          category: 'Main' },
  { label: 'Resources',     path: '/resources',     icon: FolderGit2,      category: 'Workspace' },
  { label: 'Notes',         path: '/notes',         icon: FileText,        category: 'Workspace' },
  { label: 'Chat',          path: '/chat',          icon: MessageSquare,   badge: '3', category: 'Communication' },
  { label: 'Announcements', path: '/announcements', icon: Bell,            category: 'Communication' },
];

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      <AnimatePresence>
        {isOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`fixed md:relative top-0 bottom-0 left-0 flex flex-col h-screen bg-white border-r border-slate-200/90 z-50 shrink-0 overflow-hidden transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-4 border-b border-slate-100 gap-2 h-16 shrink-0`}>
          <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => navigate('/')}>
            <div className="commons-logo-mark shrink-0">
              <span className="font-heading font-bold text-xs text-white">H</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <p className="font-heading font-bold text-slate-900 tracking-tight leading-none text-base whitespace-nowrap">
                  HackHub
                </p>
                <p className="text-[11px] text-slate-400 mt-1 whitespace-nowrap font-medium">
                  Collaboration Hub
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-3 px-2.5 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip
                key={item.path}
                content={item.label}
                placement="right"
                isDisabled={!collapsed}
                delay={0}
                closeDelay={0}
              >
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `relative flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group overflow-hidden ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate whitespace-nowrap select-none min-w-0 flex-1">
                          {item.label}
                        </span>
                      )}
                      {item.badge && !collapsed && (
                        <span className="shrink-0 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 leading-none">
                          {item.badge}
                        </span>
                      )}
                      {item.badge && collapsed && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-indigo-600" />
                      )}
                    </>
                  )}
                </NavLink>
              </Tooltip>
            );
          })}

          {/* Admin Link (Conditional) */}
          {profile?.role === UserRole.ADMIN && (
            <Tooltip content="Admin Console" placement="right" isDisabled={!collapsed} delay={0} closeDelay={0}>
              <NavLink
                to="/admin"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `relative flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 mt-1 ${
                    isActive
                      ? 'bg-amber-50 text-amber-800 font-semibold shadow-2xs'
                      : 'text-amber-700/80 hover:bg-amber-50/60 hover:text-amber-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <ShieldAlert
                      className={`w-[18px] h-[18px] shrink-0 ${
                        isActive ? 'text-amber-600' : 'text-amber-500'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate whitespace-nowrap select-none min-w-0">
                        Admin Console
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-amber-500" />
                    )}
                  </>
                )}
              </NavLink>
            </Tooltip>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="border-t border-slate-100 p-2.5 bg-slate-50/60">
          {profile && (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2 p-1.5 rounded-xl hover:bg-white hover:shadow-2xs transition-all`}>
              <div
                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                onClick={() => { handleNavClick(); navigate('/profile'); }}
                title="View your profile"
              >
                <Avatar
                  size="sm"
                  src={profile.avatarUrl || undefined}
                  name={profile.fullName.slice(0, 2).toUpperCase()}
                  className="w-8 h-8 text-[11px] bg-indigo-100 text-indigo-700 font-bold shrink-0 border border-indigo-200"
                />
                {!collapsed && (
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs font-semibold text-slate-900 truncate leading-tight whitespace-nowrap">
                      {profile.fullName}
                    </p>
                    <span className="text-[10px] text-slate-500 capitalize block leading-tight whitespace-nowrap">
                      {profile.role}
                    </span>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};
