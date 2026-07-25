import { FormEvent, useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useCreateTaskMutation } from '@/api/taskApi';

export function AddTaskInline({ listId, boardId }: { listId: number; boardId: number }) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask({ listId, boardId, title: title.trim() }).unwrap();
      setTitle('');
    } catch {
      toast.error('Could not add task. Please try again.');
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="mt-2 flex w-full items-center gap-1.5 rounded-sm px-2 py-2 text-sm text-ink-soft hover:bg-white/60 hover:text-ink transition-colors"
      >
        <FiPlus size={15} /> Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent);
          }
          if (e.key === 'Escape') setIsAdding(false);
        }}
        placeholder="Task title…"
        rows={2}
        className="w-full resize-none rounded-sm border border-blueprint bg-white px-2.5 py-2 text-sm text-ink placeholder:text-ink-faint"
        disabled={isLoading}
      />
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="rounded-sm bg-blueprint px-3 py-1.5 text-xs font-medium text-white hover:bg-blueprint-deep disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            setIsAdding(false);
            setTitle('');
          }}
          className="rounded-sm p-1.5 text-ink-faint hover:text-ink"
        >
          <FiX size={16} />
        </button>
      </div>
    </form>
  );
}
