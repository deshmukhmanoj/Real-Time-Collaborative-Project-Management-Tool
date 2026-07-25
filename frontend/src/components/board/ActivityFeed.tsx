import { FiActivity } from 'react-icons/fi';
import { useGetTaskActivityQuery } from '@/api/activityApi';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelativeTime } from '@/utils/date';

export function ActivityFeed({ taskId }: { taskId: number }) {
  const { data, isLoading } = useGetTaskActivityQuery(taskId);

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide text-ink-faint">
        <FiActivity size={12} /> Activity
      </h4>
      {isLoading ? (
        <div className="flex justify-center py-4 text-blueprint">
          <Spinner size={20} />
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto scrollbar-thin">
          {data?.data.map((item) => (
            <div key={item.id} className="flex items-baseline gap-2 text-sm">
              <span className="font-medium text-ink-soft">{item.user_name}</span>
              <span className="text-ink-faint">{item.action}</span>
              <span className="ml-auto shrink-0 text-[11px] text-ink-faint">
                {formatRelativeTime(item.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
