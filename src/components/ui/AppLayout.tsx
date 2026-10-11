import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { EditorialNavOverlay } from './EditorialNavOverlay';
import { MobileBottomNav } from './MobileBottomNav';
import { Menu } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [navOverlayOpen, setNavOverlayOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ivory-grid text-[var(--ink)]">
      {/* Sidebar navigation */}
      <Sidebar
        isOpenMobile={navOverlayOpen}
        onCloseMobile={() => setNavOverlayOpen(false)}
      />

      {/* Editorial Fullscreen Overlay Navigation (matching user's design reference) */}
      <EditorialNavOverlay
        isOpen={navOverlayOpen}
        onClose={() => setNavOverlayOpen(false)}
      />

      {/* Main content pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top header */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-8 border-b border-[var(--line)] bg-[var(--surface)]">
          {/* Left Brand */}
          <div className="flex items-center gap-2.5">
            <div className="commons-logo-mark md:hidden">
              <span className="font-heading font-bold text-xs">H</span>
            </div>
            <span className="font-heading font-bold text-base text-[var(--ink)] tracking-tight md:hidden">
              HackHub
            </span>
            <div className="hidden md:flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-[var(--ink)]">
                HackHub
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#B9FF66] text-[#191A23] font-bold">
                Platform
              </span>
            </div>
          </div>

          {/* Right Action Controls: Menu Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Menu Trigger Button */}
            <button
              onClick={() => setNavOverlayOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#191A23] text-white hover:bg-[#B9FF66] hover:text-[#191A23] border border-[#191A23] transition-all shadow-[0_3px_0_#000] cursor-pointer group"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 text-[#B9FF66] group-hover:text-[#191A23] group-hover:rotate-90 transition-all duration-200" />
              <span className="text-xs font-semibold">Menu</span>
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-28 md:pb-6">
            <Outlet />
          </div>
        </main>

        {/* Floating Mobile Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>
    </div>
  );
};
