import { useNavigate } from 'react-router-dom';
import { FiLayers, FiArrowUpRight } from 'react-icons/fi';
import { Workspace } from '@/types';
import { RoleBadge } from '@/components/ui/Badge';

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/workspaces/${workspace.id}`)}
      className="group flex flex-col items-start gap-3 rounded-md border border-line bg-white p-5 text-left shadow-card transition-all hover:shadow-card-hover hover:border-blueprint/40"
    >
      <div className="flex w-full items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-blueprint-light text-blueprint">
          <FiLayers size={17} />
        </div>
        <FiArrowUpRight
          size={16}
          className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
      <div>
        <h3 className="font-display font-semibold text-ink">{workspace.name}</h3>
        <div className="mt-1.5">
          <RoleBadge role={workspace.role} />
        </div>
      </div>
    </button>
  );
}
