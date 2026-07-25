import { useState } from 'react';
import { FiPlus, FiLayers } from 'react-icons/fi';
import { useGetMyWorkspacesQuery } from '@/api/workspaceApi';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Spinner';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data, isLoading } = useGetMyWorkspacesQuery();

  if (isLoading) return <FullPageSpinner />;

  const workspaces = data?.data || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Workspaces</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pick a workspace to see its boards, or start a new one.
          </p>
        </div>
        <Button icon={<FiPlus />} onClick={() => setIsCreateOpen(true)} className="self-start sm:self-auto">
          New workspace
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<FiLayers />}
          title="No workspaces yet"
          description="Create your first workspace to start organizing boards for your team."
          action={
            <Button onClick={() => setIsCreateOpen(true)} icon={<FiPlus />}>
              New workspace
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}

      <CreateWorkspaceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}