import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateWorkspaceMutation } from '@/api/workspaceApi';

export function CreateWorkspaceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createWorkspace({ name }).unwrap();
      toast.success(`Workspace "${name}" created`);
      setName('');
      onClose();
    } catch {
      toast.error('Could not create workspace. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New workspace">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Workspace name"
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Engineering, Marketing Team"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} size="sm">
            Create workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
}
