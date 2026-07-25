import { NavLink, useParams } from 'react-router-dom';
import { FiGrid, FiLayers, FiLogOut, FiX } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';
import { useLogoutUserMutation } from '@/api/authApi';
import { useGetMyWorkspacesQuery } from '@/api/workspaceApi';
import { Avatar } from '../ui/Avatar';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const [logoutUser] = useLogoutUserMutation();
  const { data } = useGetMyWorkspacesQuery();
  const { workspaceId } = useParams();

  const handleLogout = async () => {
    try {
      if (refreshToken) await logoutUser({ refreshToken }).unwrap();
    } finally {
      dispatch(logout());
    }
  };

  return (
    <>
      {/* Backdrop — mobile only, shown while the drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-60 shrink-0 flex-col bg-blueprint-deep text-white/90',
          'transition-transform duration-200 ease-out',
          'md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-amber font-display text-sm font-bold text-blueprint-deep">
              B
            </div>
            <span className="font-display text-base font-semibold text-white">Boardline</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            <FiX size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <p className="px-2 pb-2 text-[11px] font-mono uppercase tracking-wider text-white/40">
            Workspaces
          </p>
          <div className="flex flex-col gap-0.5">
            {data?.data.map((ws) => (
              <NavLink
                key={ws.id}
                to={`/workspaces/${ws.id}`}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded px-2.5 py-2 text-sm transition-colors',
                    isActive || workspaceId === String(ws.id)
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <FiLayers size={15} className="shrink-0" />
                <span className="truncate">{ws.name}</span>
              </NavLink>
            ))}
            <NavLink
              to="/"
              end
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'mt-2 flex items-center gap-2 rounded px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <FiGrid size={15} className="shrink-0" />
              All workspaces
            </NavLink>
          </div>
        </nav>

        <div className="flex items-center gap-2.5 border-t border-white/10 px-4 py-3.5">
          <Avatar name={user?.name || '?'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-white/50">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="shrink-0 rounded p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}