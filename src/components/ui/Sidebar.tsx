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
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: '/',             icon: LayoutDashboard },
  { label: 'Faculty Hub',   path: '/faculty',      icon: GraduationCap },
  { label: 'Teams',         path: '/teams',         icon: Users },
  { label: 'Resources',     path: '/resources',     icon: FolderGit2 },
  { label: 'Venue Map',     path: '/map',           icon: MapPin },
  { label: 'Notes',         path: '/notes',         icon: FileText },
  { label: 'Chat',          path: '/chat',          icon: MessageSquare, badge: '3' },
  { label: 'Announcements', path: '/announcements', icon: Bell },
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
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed md:relative top-0 bottom-0 left-0 flex flex-col h-screen bg-[var(--surface)] border-r border-[var(--line)] z-50 shrink-0 overflow-hidden transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header with Awesome Menu Icon on the RIGHT */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3.5 py-4 border-b border-[var(--line)] gap-2`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="commons-logo-mark shrink-0">
              <span className="font-heading font-bold text-sm text-[var(--surface)]">H</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <p className="font-heading font-bold text-[var(--ink)] tracking-tight leading-none text-base whitespace-nowrap">
                  HackHub
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 whitespace-nowrap">Workspace</p>
              </div>
            )}
          </div>

          {/* Awesome Menu Toggle Button on the RIGHT (Desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shadow-sm group shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform text-[var(--ink)]" />
            ) : (
              <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform text-[var(--ink)]" />
            )}
          </button>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)] transition-colors shrink-0"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
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
                    `relative flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 group overflow-hidden ${
                      isActive
                        ? 'commons-nav-active'
                        : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--line)_35%,transparent)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)] group-hover:text-[var(--ink)]'}`} />
                      {!collapsed && (
                        <span className="truncate whitespace-nowrap select-none min-w-0 flex-1">
                          {item.label}
                        </span>
                      )}
                      {item.badge && !collapsed && (
                        <span className="shrink-0 text-[10px] font-bold bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] rounded-full px-2 py-0.5 leading-none">
                          {item.badge}
                        </span>
                      )}
                      {item.badge && collapsed && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent)]" />
                      )}
                    </>
                  )}
                </NavLink>
              </Tooltip>
            );
          })}

          {/* Admin link (conditional) */}
          {profile?.role === UserRole.ADMIN && (
            <Tooltip content="Admin" placement="right" isDisabled={!collapsed} delay={0} closeDelay={0}>
              <NavLink
                to="/admin"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `relative flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 mt-1 ${
                    isActive
                      ? 'commons-nav-active'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--line)_35%,transparent)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <ShieldAlert className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--moss)]'}`} />
                    {!collapsed && (
                      <span className="truncate whitespace-nowrap select-none min-w-0">
                        Admin
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </Tooltip>
          )}
        </nav>

        {/* Clean, minimal Profile footer */}
        <div className="border-t border-[var(--line)] p-2.5 bg-[var(--surface)]">
          {profile && (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2 p-1.5 rounded-lg hover:bg-[color-mix(in_srgb,var(--line)_30%,transparent)] transition-colors`}>
              <div
                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                onClick={() => { handleNavClick(); navigate('/profile'); }}
                title="View your profile"
              >
                <Avatar
                  size="sm"
                  src={profile.avatarUrl || undefined}
                  name={profile.fullName.slice(0, 2).toUpperCase()}
                  className="w-7 h-7 text-[10px] border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] shrink-0"
                />
                {!collapsed && (
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs font-semibold text-[var(--ink)] truncate leading-tight whitespace-nowrap">
                      {profile.fullName}
                    </p>
                    <span className="text-[10px] text-[var(--muted)] capitalize block leading-tight whitespace-nowrap">
                      {profile.role}
                    </span>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] transition-colors shrink-0"
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
