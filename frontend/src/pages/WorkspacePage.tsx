import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiPlus, FiUsers, FiTrello } from 'react-icons/fi';
import { useGetWorkspaceBoardsQuery } from '@/api/boardApi';
import { useGetMyWorkspacesQuery } from '@/api/workspaceApi';
import { BoardCard, CreateBoardModal } from '@/components/workspace/BoardCard';
import { MembersModal } from '@/components/workspace/MembersModal';
import { Button } from '@/components/ui/Button';
import { EmptyState, FullPageSpinner } from '@/components/ui/Spinner';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const wsId = Number(workspaceId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const { data: boardsData, isLoading } = useGetWorkspaceBoardsQuery(wsId, { skip: !wsId });
  const { data: workspacesData } = useGetMyWorkspacesQuery();

  const currentWorkspace = workspacesData?.data.find((w) => w.id === wsId);
  const canManage = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin';

  if (isLoading) return <FullPageSpinner />;

  const boards = boardsData?.data || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="page-header-row">
        <div className="min-w-0">
          <h1 className="page-title truncate">
            {currentWorkspace?.name || 'Workspace'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Boards inside this workspace.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="secondary" icon={<FiUsers />} onClick={() => setIsMembersOpen(true)}>
            Members
          </Button>
          <Button icon={<FiPlus />} onClick={() => setIsCreateOpen(true)}>
            New board
          </Button>
        </div>
      </div>

      {boards.length === 0 ? (
        <EmptyState
          icon={<FiTrello />}
          title="No boards yet"
          description="Create a board to start tracking tasks with your team."
          action={
            <Button onClick={() => setIsCreateOpen(true)} icon={<FiPlus />}>
              New board
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} workspaceId={wsId} />
          ))}
        </div>
      )}

      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        workspaceId={wsId}
      />
      <MembersModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        workspaceId={wsId}
        canManage={!!canManage}
      />
    </div>
  );
}