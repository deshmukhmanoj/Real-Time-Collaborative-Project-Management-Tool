import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiTrello, FiArrowUpRight } from 'react-icons/fi';
import { Board } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateBoardMutation } from '@/api/boardApi';

export function BoardCard({ board, workspaceId }: { board: Board; workspaceId: number }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/workspaces/${workspaceId}/boards/${board.id}`)}
      className="group flex flex-col items-start gap-3 rounded-md border border-line bg-white p-5 text-left shadow-card transition-all hover:shadow-card-hover hover:border-blueprint/40"
    >
      <div className="flex w-full items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-amber-light text-amber">
          <FiTrello size={17} />
        </div>
        <FiArrowUpRight
          size={16}
          className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
      <h3 className="font-display font-semibold text-ink">{board.title}</h3>
    </button>
  );
}

export function CreateBoardModal({
  isOpen,
  onClose,
  workspaceId,
}: {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
}) {
  const [title, setTitle] = useState('');
  const [createBoard, { isLoading }] = useCreateBoardMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createBoard({ workspaceId, title }).unwrap();
      toast.success(`Board "${title}" created`);
      setTitle('');
      onClose();
    } catch {
      toast.error('Could not create board. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New board">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Board name"
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sprint 24, Q3 Roadmap"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} size="sm">
            Create board
          </Button>
        </div>
      </form>
    </Modal>
  );
}
