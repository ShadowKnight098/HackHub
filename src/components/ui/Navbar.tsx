import React from 'react';
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Chip,
} from '@heroui/react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Flame,
  Users,
  GraduationCap,
  FolderGit2,
  MapPin,
  FileText,
  MessageSquare,
  Bell,
  ShieldAlert,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/enums';

export const Navbar: React.FC = () => {
  const { profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: Flame },
    { label: 'Faculty Hub', path: '/faculty', icon: GraduationCap },
    { label: 'Teams', path: '/teams', icon: Users },
    { label: 'Resources', path: '/resources', icon: FolderGit2 },
    { label: 'Venue Map', path: '/map', icon: MapPin },
    { label: 'Notes', path: '/notes', icon: FileText },
    { label: 'Chat', path: '/chat', icon: MessageSquare },
    { label: 'Announcements', path: '/announcements', icon: Bell },
  ];

  return (
    <HeroNavbar
      maxWidth="full"
      className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4"
    >
      <NavbarBrand className="gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 shadow-md shadow-primary-500/20 text-white font-bold text-lg">
          H
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-white text-lg">HackHub</span>
          <span className="text-[10px] text-primary-400 font-mono uppercase tracking-widest -mt-1">
            Collab Platform
          </span>
        </div>
      </NavbarBrand>

      <NavbarContent className="hidden lg:flex gap-1" justify="center">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavbarItem key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-500/15 text-primary-400 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            </NavbarItem>
          );
        })}
        {profile?.role === UserRole.ADMIN && (
          <NavbarItem>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 font-semibold'
                    : 'text-amber-300/80 hover:text-amber-300 hover:bg-amber-500/10'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4" />
              Admin
            </NavLink>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-3">
        {isAuthenticated && profile ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-slate-800 transition">
                <Avatar
                  isBordered
                  color="primary"
                  size="sm"
                  src={profile.avatarUrl || undefined}
                  name={profile.fullName.slice(0, 2).toUpperCase()}
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {profile.fullName}
                  </span>
                  <div className="flex items-center gap-1">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={profile.role === UserRole.ADMIN ? 'warning' : 'primary'}
                      className="h-4 text-[9px] px-1 capitalize"
                    >
                      {profile.role}
                    </Chip>
                  </div>
                </div>
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile actions" variant="flat">
              <DropdownItem key="profile" textValue="Signed in as" className="h-14 gap-2">
                <p className="font-semibold text-xs text-slate-400">Signed in as</p>
                <p className="font-semibold text-sm text-white">{profile.email}</p>
              </DropdownItem>
              <DropdownItem
                key="account"
                startContent={<UserIcon className="w-4 h-4" />}
                onPress={() => navigate('/profile')}
              >
                My Profile
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
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="light"
              size="sm"
              onPress={() => navigate('/login')}
              className="text-slate-300"
            >
              Sign In
            </Button>
            <Button
              color="primary"
              size="sm"
              onPress={() => navigate('/register')}
              className="font-medium"
            >
              Register
            </Button>
          </div>
        )}
      </NavbarContent>
    </HeroNavbar>
  );
};
