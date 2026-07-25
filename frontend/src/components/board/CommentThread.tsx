import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSend } from 'react-icons/fi';
import { useGetTaskCommentsQuery, useAddCommentMutation } from '@/api/commentApi';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelativeTime, formatTimestamp } from '@/utils/date';

export function CommentThread({ taskId }: { taskId: number }) {
  const { data, isLoading } = useGetTaskCommentsQuery(taskId);
  const [addComment, { isLoading: isSending }] = useAddCommentMutation();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await addComment({ taskId, content: content.trim() }).unwrap();
      setContent('');
    } catch {
      toast.error('Could not post comment.');
    }
  };

  return (
    <div>
      <h4 className="mb-2 text-xs font-mono uppercase tracking-wide text-ink-faint">Comments</h4>

      <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded border border-line bg-white px-3 py-2 text-sm placeholder:text-ink-faint focus:border-blueprint"
        />
        <button
          type="submit"
          disabled={isSending || !content.trim()}
          className="flex items-center justify-center rounded bg-blueprint px-3 text-white hover:bg-blueprint-deep disabled:opacity-50"
        >
          <FiSend size={14} />
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-4 text-blueprint">
          <Spinner size={20} />
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-48 overflow-y-auto scrollbar-thin">
          {data?.data.length === 0 && (
            <p className="text-sm text-ink-faint">No comments yet — be the first to add one.</p>
          )}
          {data?.data.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.user_name} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-ink">{c.user_name}</span>
                  <span
                    className="text-[11px] text-ink-faint cursor-default"
                    title={formatTimestamp(c.created_at)}
                  >
                    {formatRelativeTime(c.created_at)}
                  </span>
                </div>
                <p className="text-sm text-ink-soft">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
