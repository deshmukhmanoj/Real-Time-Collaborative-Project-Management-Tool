import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiTrash2, FiCheckCircle, FiCircle } from 'react-icons/fi';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CommentThread } from './CommentThread';
import { ActivityFeed } from './ActivityFeed';
import { Task, TaskPriority, WorkspaceMember } from '@/types';
import {
  useUpdateTaskMutation,
  useToggleTaskCompleteMutation,
  useDeleteTaskMutation,
} from '@/api/taskApi';

interface TaskModalProps {
  task: Task;
  boardId: number;
  members: WorkspaceMember[];
  onClose: () => void;
}

export function TaskModal({ task, boardId, members, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assignedTo, setAssignedTo] = useState<number | ''>(task.assigned_to ?? '');
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 10) : '');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [updateTask, { isLoading: isSaving }] = useUpdateTaskMutation();
  const [toggleComplete] = useToggleTaskCompleteMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title cannot be empty.');
      return;
    }
    try {
      await updateTask({
        taskId: task.id,
        boardId,
        title: title.trim(),
        description: description.trim() || null,
        assignedTo: assignedTo === '' ? null : Number(assignedTo),
        dueDate: dueDate || null,
        priority,
      }).unwrap();
      toast.success('Task saved');
    } catch {
      toast.error('Could not save task.');
    }
  };

  const handleToggleComplete = async () => {
    try {
      await toggleComplete({ taskId: task.id, boardId, isCompleted: !task.is_completed }).unwrap();
    } catch {
      toast.error('Could not update task status.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask({ taskId: task.id, boardId, listId: task.list_id }).unwrap();
      toast.success('Task deleted');
      onClose();
    } catch {
      toast.error('Could not delete task.');
    }
  };

  return (
    <>
      <Modal isOpen onClose={onClose} maxWidth="max-w-xl">
        <div className="flex items-start justify-between gap-3">
          <span className="mt-1 font-mono text-xs text-ink-faint">TSK-{task.id}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleComplete}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-ink-soft hover:bg-paper"
              title={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.is_completed ? (
                <FiCheckCircle className="text-moss" size={16} />
              ) : (
                <FiCircle size={16} />
              )}
              {task.is_completed ? 'Completed' : 'Mark complete'}
            </button>
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="rounded p-1.5 text-ink-faint hover:bg-coral-light hover:text-coral transition-colors"
              title="Delete task"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>

        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          rows={1}
          className="mt-2 w-full resize-none border-none bg-transparent font-display text-xl font-semibold text-ink outline-none"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleSave}
          rows={3}
          placeholder="Add more detail…"
          className="mt-3"
        />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as TaskPriority);
              }}
              onBlur={handleSave}
              className="rounded border border-line bg-white px-2.5 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Assignee</label>
            <select
              value={assignedTo}
              onChange={(e) =>
                setAssignedTo(e.target.value === '' ? '' : Number(e.target.value))
              }
              onBlur={handleSave}
              className="rounded border border-line bg-white px-2.5 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={handleSave}
              className="rounded border border-line bg-white px-2.5 py-2 text-sm"
            />
          </div>
        </div>

        {isSaving && <p className="mt-2 text-xs text-ink-faint">Saving…</p>}

        <div className="mt-5 flex flex-col gap-5 border-t border-line pt-4">
          <CommentThread taskId={task.id} />
          <ActivityFeed taskId={task.id} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete this task?"
        description="This will permanently delete the task, its comments, and its activity history."
        isLoading={isDeleting}
      />
    </>
  );
}