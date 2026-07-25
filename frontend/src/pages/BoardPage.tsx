import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { FiUsers } from 'react-icons/fi';
import { useGetBoardFullQuery } from '@/api/boardApi';
import { useGetWorkspaceMembersQuery } from '@/api/workspaceApi';
import { useMoveTaskMutation } from '@/api/taskApi';
import { useReorderListMutation } from '@/api/listApi';
import { useBoardSocket } from '@/sockets/useBoardSocket';
import { BoardColumn } from '@/components/board/BoardColumn';
import { AddListForm } from '@/components/board/AddListForm';
import { TaskModal } from '@/components/board/TaskModal';
import { MembersModal } from '@/components/workspace/MembersModal';
import { Button } from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { WorkspaceMember } from '@/types';

export default function BoardPage() {
  const { boardId, workspaceId } = useParams();
  const id = Number(boardId);
  const wsId = Number(workspaceId);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const { data, isLoading } = useGetBoardFullQuery(id, { skip: !id });
  const [moveTask] = useMoveTaskMutation();
  const [reorderList] = useReorderListMutation();

  useBoardSocket(id);

  const { data: membersData } = useGetWorkspaceMembersQuery(wsId, { skip: !wsId });

  const membersById = useMemo(() => {
    const map: Record<number, WorkspaceMember> = {};
    membersData?.data.forEach((m) => (map[m.user_id] = m));
    return map;
  }, [membersData]);

  const board = data?.data;
  const activeTask = board?.lists.flatMap((l) => l.tasks).find((t) => t.id === activeTaskId);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (type === 'LIST') {
      reorderList({
        boardId: id,
        listId: Number(draggableId),
        position: destination.index + 1,
      });
      return;
    }

    moveTask({
      taskId: Number(draggableId),
      boardId: id,
      sourceListId: Number(source.droppableId),
      newListId: Number(destination.droppableId),
      newPosition: destination.index + 1,
    });
  };

  if (isLoading || !board) return <FullPageSpinner />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 shrink-0 sm:px-6 sm:py-4">
        <h1 className="truncate font-display text-lg font-semibold">{board.title}</h1>
        <Button
          variant="secondary"
          size="sm"
          icon={<FiUsers />}
          onClick={() => setIsMembersOpen(true)}
          className="shrink-0"
        >
          Team
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-1 gap-4 overflow-x-auto px-4 py-5 sm:px-6 scrollbar-thin items-start"
            >
              {board.lists
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((list) => (
                  <BoardColumn
                    key={list.id}
                    list={list}
                    boardId={id}
                    membersById={membersById}
                    onTaskClick={setActiveTaskId}
                  />
                ))}
              {provided.placeholder}
              <AddListForm boardId={id} />
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {activeTask && (
        <TaskModal
          task={activeTask}
          boardId={id}
          members={membersData?.data || []}
          onClose={() => setActiveTaskId(null)}
        />
      )}

      <MembersModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        workspaceId={wsId}
        canManage={false}
      />
    </div>
  );
}