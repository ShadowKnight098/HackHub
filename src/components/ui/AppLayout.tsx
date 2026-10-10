import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { EditorialNavOverlay } from './EditorialNavOverlay';
import { useTheme } from '@/lib/theme';
import { Sun, Moon, Menu } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
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
              <span className="font-heading font-bold text-xs text-[var(--surface)]">H</span>
            </div>
            <span className="font-heading font-bold text-base text-[var(--ink)] tracking-tight md:hidden">
              HackHub
            </span>
            <span className="hidden md:inline font-accent italic text-xs text-[var(--muted)]">
              Ivory & Burgundy Editorial Suite
            </span>
          </div>

          {/* Right Action Controls: Theme + Awesome Editorial Menu Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick theme button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--sun)] transition-all shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[var(--sun)]" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[var(--sky)]" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Awesome Editorial Menu Trigger on the RIGHT (Desktop + Mobile) */}
            <button
              onClick={() => setNavOverlayOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--ink)] transition-all shadow-sm group"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 text-[var(--accent)] group-hover:rotate-90 transition-transform duration-200" />
              <span className="text-xs font-semibold">Menu</span>
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
