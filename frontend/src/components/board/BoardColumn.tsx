import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { Droppable } from '@hello-pangea/dnd';
import { ListColumn, WorkspaceMember } from '@/types';
import { TaskCard } from './TaskCard';
import { AddTaskInline } from './AddTaskInline';
import { ListMenu } from './ListMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRenameListMutation, useDeleteListMutation } from '@/api/listApi';
import { cn } from '@/utils/cn';

interface BoardColumnProps {
  list: ListColumn;
  boardId: number;
  membersById: Record<number, WorkspaceMember>;
  onTaskClick: (taskId: number) => void;
}

export function BoardColumn({ list, boardId, membersById, onTaskClick }: BoardColumnProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [renameList] = useRenameListMutation();
  const [deleteList, { isLoading: isDeleting }] = useDeleteListMutation();

  const handleRenameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();

    if (!trimmed) {
      setTitle(list.title);
      setIsRenaming(false);
      return;
    }
    if (trimmed === list.title) {
      setIsRenaming(false);
      return;
    }

    try {
      await renameList({ boardId, listId: list.id, title: trimmed }).unwrap();
      setIsRenaming(false);
    } catch {
      toast.error('Could not rename list.');
      setTitle(list.title);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteList({ boardId, listId: list.id }).unwrap();
      toast.success(`"${list.title}" deleted`);
    } catch {
      toast.error('Could not delete list.');
    } finally {
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="flex w-[85vw] max-w-72 shrink-0 flex-col rounded-md bg-paper-dark/60">
      {/* Manila-tab style header */}
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5">
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="min-w-0 flex-1">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setTitle(list.title);
                  setIsRenaming(false);
                }
              }}
              className="w-full rounded-sm border border-blueprint bg-white px-1.5 py-0.5 font-display text-sm font-semibold text-ink"
            />
          </form>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <h3
              onClick={() => setIsRenaming(true)}
              title="Click to rename"
              className="truncate font-display text-sm font-semibold text-ink cursor-text"
            >
              {list.title}
            </h3>
            <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
              {list.tasks.length}
            </span>
          </div>
        )}

        <ListMenu onRename={() => setIsRenaming(true)} onDelete={() => setIsConfirmOpen(true)} />
      </div>
      <div className="tab-perforation mx-3.5" />

      <Droppable droppableId={String(list.id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 scrollbar-thin min-h-[60px] transition-colors',
              snapshot.isDraggingOver && 'bg-blueprint/5'
            )}
          >
            {list.tasks
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  assigneeName={task.assigned_to ? membersById[task.assigned_to]?.name : undefined}
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
            {provided.placeholder}
            <AddTaskInline listId={list.id} boardId={boardId} />
          </div>
        )}
      </Droppable>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete this list?"
        description={`This will permanently delete "${list.title}" and every task inside it.`}
        isLoading={isDeleting}
      />
    </div>
  );
}