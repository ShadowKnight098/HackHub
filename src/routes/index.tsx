import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { AppLayout } from '@/components/ui/AppLayout';

// Lazy loaded page components
const Dashboard = lazy(() => import('@/features/dashboard').then((m) => ({ default: m.Dashboard })));
const LoginForm = lazy(() => import('@/features/auth').then((m) => ({ default: m.LoginForm })));
const RegisterForm = lazy(() => import('@/features/auth').then((m) => ({ default: m.RegisterForm })));
const UserProfile = lazy(() => import('@/features/auth').then((m) => ({ default: m.UserProfile })));
const TeamList = lazy(() => import('@/features/teams').then((m) => ({ default: m.TeamList })));
const TeamDetail = lazy(() => import('@/features/teams').then((m) => ({ default: m.TeamDetail })));
const ResourceList = lazy(() => import('@/features/resources').then((m) => ({ default: m.ResourceList })));
const VenueMap = lazy(() => import('@/features/maps').then((m) => ({ default: m.VenueMap })));
const NoteList = lazy(() => import('@/features/notes').then((m) => ({ default: m.NoteList })));
const ChatLayout = lazy(() => import('@/features/chat').then((m) => ({ default: m.ChatLayout })));
const AnnouncementList = lazy(() => import('@/features/announcements').then((m) => ({ default: m.AnnouncementList })));
const AdminDashboard = lazy(() => import('@/features/admin').then((m) => ({ default: m.AdminDashboard })));

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <Spinner size="lg" color="primary" label="Loading view..." />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/teams" element={<TeamList />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
          <Route path="/resources" element={<ResourceList />} />
          <Route path="/map" element={<VenueMap />} />
          <Route path="/notes" element={<NoteList />} />
          <Route path="/chat" element={<ChatLayout />} />
          <Route path="/announcements" element={<AnnouncementList />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
