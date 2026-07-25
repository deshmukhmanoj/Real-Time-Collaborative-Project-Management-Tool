import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { FiUserPlus } from 'react-icons/fi';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { RoleBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useGetWorkspaceMembersQuery, useAddWorkspaceMemberMutation } from '@/api/workspaceApi';
import { useLazyLookupUserByEmailQuery } from '@/api/userApi';
import { WorkspaceRole } from '@/types';

export function MembersModal({
  isOpen,
  onClose,
  workspaceId,
  canManage,
}: {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  canManage: boolean;
}) {
  const { data, isLoading } = useGetWorkspaceMembersQuery(workspaceId, { skip: !isOpen });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workspace members" maxWidth="max-w-lg">
      {canManage && <InviteMemberForm workspaceId={workspaceId} />}

      <div className="mt-4 flex flex-col gap-1">
        {isLoading ? (
          <div className="flex justify-center py-6 text-blueprint">
            <Spinner />
          </div>
        ) : (
          data?.data.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center gap-3 rounded px-2 py-2 hover:bg-paper"
            >
              <Avatar name={m.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                <p className="truncate text-xs text-ink-soft">{m.email}</p>
              </div>
              <RoleBadge role={m.role} />
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

function InviteMemberForm({ workspaceId }: { workspaceId: number }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('member');
  const [lookupUser, { isFetching: isLookingUp }] = useLazyLookupUserByEmailQuery();
  const [addMember, { isLoading: isAdding }] = useAddWorkspaceMemberMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const user = await lookupUser(email).unwrap();
      await addMember({ workspaceId, userId: user.data.id, role }).unwrap();
      toast.success(`${user.data.name} added to workspace`);
      setEmail('');
    } catch (err: any) {
      const code = err?.data?.error;
      if (code === 'USER_NOT_FOUND') {
        toast.error('No account found with that email.');
      } else if (code === 'ALREADY_A_MEMBER') {
        toast.error('That person is already a member.');
      } else {
        toast.error('Could not add member. Please try again.');
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end"
    >
      <Input
        label="Invite by email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="teammate@company.com"
        className="flex-1"
      />
      <div className="flex gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as WorkspaceRole)}
          className="h-[38px] flex-1 rounded border border-line bg-white px-2 text-sm text-ink sm:flex-none"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <Button
          type="submit"
          isLoading={isLookingUp || isAdding}
          icon={<FiUserPlus />}
          size="md"
          className="shrink-0"
        >
          Invite
        </Button>
      </div>
    </form>
  );
}