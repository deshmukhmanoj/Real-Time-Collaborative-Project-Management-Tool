import { ReactNode, useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only top bar with hamburger — hidden at md and up, where the sidebar is always visible */}
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded p-1.5 text-ink-soft transition-colors hover:bg-paper hover:text-ink"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber font-display text-xs font-bold text-blueprint-deep">
              B
            </div>
            <span className="font-display text-sm font-semibold text-ink">Boardline</span>
          </div>
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}