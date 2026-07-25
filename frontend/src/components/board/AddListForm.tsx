import { FormEvent, useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useCreateListMutation } from '@/api/listApi';

export function AddListForm({ boardId }: { boardId: number }) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [createList, { isLoading }] = useCreateListMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createList({ boardId, title: title.trim() }).unwrap();
      setTitle('');
      setIsAdding(false);
    } catch {
      toast.error('Could not add list. Please try again.');
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex h-11 w-[85vw] max-w-72 shrink-0 items-center gap-2 rounded-md border border-dashed border-ink-faint/40 px-4 text-sm font-medium text-ink-soft hover:border-blueprint hover:text-blueprint transition-colors"
      >
        <FiPlus size={16} /> Add list
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-fit w-[85vw] max-w-72 shrink-0 flex-col gap-2 rounded-md bg-paper-dark/60 p-3"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setIsAdding(false)}
        placeholder="List name…"
        className="w-full rounded-sm border border-blueprint bg-white px-2.5 py-2 text-sm text-ink placeholder:text-ink-faint"
        disabled={isLoading}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="rounded-sm bg-blueprint px-3 py-1.5 text-xs font-medium text-white hover:bg-blueprint-deep disabled:opacity-50"
        >
          Add list
        </button>
        <button
          type="button"
          onClick={() => setIsAdding(false)}
          className="rounded-sm p-1.5 text-ink-faint hover:text-ink"
        >
          <FiX size={16} />
        </button>
      </div>
    </form>
  );
}