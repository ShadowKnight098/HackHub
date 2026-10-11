import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickSearchModal } from './QuickSearchModal';
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

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard & Telemetry',
  '/teams': 'Team Directory',
  '/faculty': 'Faculty Supervision Hub',
  '/resources': 'Resource Hub',
  '/map': 'Venue Floor Map',
  '/notes': 'Collaborative Notes',
  '/chat': 'Communication Channels',
  '/announcements': 'Announcements & Bulletins',
  '/admin': 'Director & Admin Console',
  '/profile': 'Participant Profile',
};

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Resolve current page title
  const currentPath = location.pathname;
  const pageTitle = ROUTE_TITLES[currentPath] || (currentPath.startsWith('/teams/') ? 'Team Details' : 'Workspace');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] text-slate-900">
      {/* Sidebar navigation */}
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
        {/* Top header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-200/90 bg-white/95 backdrop-blur-md z-30">
          {/* Left: Mobile Hamburger & Page Context */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Mark */}
            <div className="commons-logo-mark md:hidden">
              <span className="font-heading font-bold text-xs text-white">H</span>
            </div>

            {/* Desktop Page Title & Context */}
            <div className="flex items-center gap-2.5">
              <span className="font-heading font-bold text-base text-slate-900 tracking-tight">
                {pageTitle}
              </span>
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live 2026 Session</span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-white text-slate-500 text-xs transition-all shadow-2xs cursor-pointer group"
              title="Search everything (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span className="hidden sm:inline font-medium">Search...</span>
              <kbd className="hidden md:inline-flex px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400 group-hover:border-slate-300">
                ⌘K
              </kbd>
            </button>

            {/* Hackathon Countdown Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>26h Left</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/announcements')}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Announcements & Bulletins"
              aria-label="Announcements"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* User Profile Dropdown */}
            {profile && (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <div className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition">
                    <Avatar
                      size="sm"
                      src={profile.avatarUrl || undefined}
                      name={profile.fullName.slice(0, 2).toUpperCase()}
                      className="w-8 h-8 text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200"
                    />
                    <div className="hidden md:flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-900 leading-tight">
                        {profile.fullName}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize leading-tight">
                        {profile.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                  </div>
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
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-8">
            <Outlet />
          </div>
        </main>

        {/* Floating Mobile Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
