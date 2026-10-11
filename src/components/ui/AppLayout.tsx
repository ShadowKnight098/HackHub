import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AOS from 'aos';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickSearchModal } from './QuickSearchModal';
import { ErrorBoundary } from './ErrorBoundary';
import {
  Menu,
  Search,
  Clock,
  Bell,
  User as UserIcon,
  LogOut,
  GraduationCap,
  ShieldAlert,
  ChevronDown,
  LayoutDashboard,
  Users,
  MapPin,
  FolderGit2,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from '@heroui/react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/enums';

const QUICK_NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Teams', path: '/teams', icon: Users },
  { label: 'Faculty', path: '/faculty', icon: GraduationCap },
  { label: 'Map', path: '/map', icon: MapPin },
  { label: 'Resources', path: '/resources', icon: FolderGit2 },
  { label: 'Notes', path: '/notes', icon: FileText },
  { label: 'Chat', path: '/chat', icon: MessageSquare },
];

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Global Ctrl+K / Cmd+K listener for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const mainScrollRef = useRef<HTMLElement>(null);

  // Sync AOS animations with route changes and internal container scroll
  useEffect(() => {
    AOS.refresh();
  }, [location.pathname]);

  useEffect(() => {
    const container = mainScrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      AOS.refresh();
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] text-slate-900">
      {/* Sidebar navigation for deep access */}
      <Sidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Global Quick Search Dialog */}
      <QuickSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Main content pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8FAFC]">
        {/* ── ULTRA-COOL FLOATING GLASSMORPHIC NAVBAR ────────────────────────── */}
        <header className="sticky top-3 sm:top-3.5 z-30 mx-3 sm:mx-6 lg:mx-8 px-3.5 sm:px-5 py-2.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between transition-all duration-300">
          {/* Left: Mobile Hamburger & Brand Monogram */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </motion.button>

            {/* Brand Logo & Name */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white flex items-center justify-center font-heading font-black text-xs shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
                H
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-heading font-bold text-sm text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  HackHub
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                  Cohort 2026
                </span>
              </div>
            </motion.div>
          </div>

          {/* Center: Desktop Fluid Navigation Pills with Framer Motion Spring */}
          <nav
            onMouseLeave={() => setHoveredNav(null)}
            className="hidden xl:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50 relative"
          >
            {QUICK_NAV_ITEMS.map((item) => {
              const isActive = item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path);
              const isHovered = hoveredNav === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHoveredNav(item.path)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer flex items-center gap-1.5 z-10 ${
                    isActive
                      ? 'text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {/* Sliding active pill indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/80 -z-10"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}

                  {/* Hover ambient pill */}
                  {!isActive && isHovered && (
                    <motion.div
                      layoutId="navbar-hover-pill"
                      className="absolute inset-0 bg-white/60 rounded-lg -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Search Trigger */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 bg-slate-50/80 hover:bg-white text-slate-500 hover:text-slate-800 text-xs transition-all shadow-2xs cursor-pointer group"
              title="Search everything (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="hidden md:inline font-medium">Search...</span>
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                ⌘K
              </kbd>
            </motion.button>

            {/* Live Hackathon Countdown Beacon */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-[11px] text-slate-800">26h Left</span>
            </div>

            {/* Notification Bell with Fluid Wiggle on Hover */}
            <motion.button
              whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={() => navigate('/announcements')}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Announcements & Bulletins"
              aria-label="Announcements"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </motion.button>

            <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* User Profile Dropdown */}
            {profile && (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition group"
                  >
                    <div className="relative">
                      <Avatar
                        size="sm"
                        src={profile.avatarUrl || undefined}
                        name={(profile.fullName || 'Hacker').slice(0, 2).toUpperCase()}
                        className="w-8 h-8 text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 group-hover:ring-2 group-hover:ring-indigo-500/40 group-hover:ring-offset-1 transition-all"
                      />
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-900 leading-tight">
                        {profile.fullName || 'Hacker'}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize leading-tight font-mono">
                        {profile.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block group-hover:text-slate-700 transition-colors" />
                  </motion.div>
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile actions" variant="flat">
                  <DropdownItem key="user_info" textValue="Signed in as" className="h-12 gap-1" isReadOnly>
                    <p className="text-[11px] text-slate-400 font-medium">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-900 truncate">{profile.email}</p>
                  </DropdownItem>
                  <DropdownItem
                    key="profile"
                    startContent={<UserIcon className="w-4 h-4 text-slate-500" />}
                    onPress={() => navigate('/profile')}
                  >
                    My Profile
                  </DropdownItem>
                  <DropdownItem
                    key="faculty"
                    startContent={<GraduationCap className="w-4 h-4 text-slate-500" />}
                    onPress={() => navigate('/faculty')}
                  >
                    Faculty Supervision
                  </DropdownItem>
                  <DropdownItem
                    key="admin"
                    className={profile.role === UserRole.ADMIN ? '' : 'hidden'}
                    startContent={<ShieldAlert className="w-4 h-4 text-amber-500" />}
                    onPress={() => navigate('/admin')}
                  >
                    Admin Console
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    className="text-danger"
                    startContent={<LogOut className="w-4 h-4" />}
                    onPress={handleSignOut}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </header>

        {/* Page body */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto bg-[#F8FAFC] scroll-smooth">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 md:pb-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {/* Floating Mobile Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
