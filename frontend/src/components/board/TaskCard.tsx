import { Draggable } from '@hello-pangea/dnd';
import { FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import { Task } from '@/types';
import { formatDueDate, isOverdue } from '@/utils/date';
import { Avatar } from '@/components/ui/Avatar';
import { PriorityBadge } from '@/components/ui/Badge';

const priorityStripe: Record<Task['priority'], string> = {
  low: 'before:bg-moss',
  medium: 'before:bg-blueprint',
  high: 'before:bg-amber',
  urgent: 'before:bg-coral',
};

interface TaskCardProps {
  task: Task;
  index: number;
  assigneeName?: string;
  onClick: () => void;
}

export function TaskCard({ task, index, assigneeName, onClick }: TaskCardProps) {
  const overdue = isOverdue(task.due_date, task.is_completed);

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            'group relative cursor-pointer rounded-sm border border-line bg-white pl-3.5 pr-3 py-3 shadow-card transition-shadow',
            'before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-sm',
            priorityStripe[task.priority],
            snapshot.isDragging ? 'shadow-card-hover rotate-1' : 'hover:shadow-card-hover'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[10px] text-ink-faint">TSK-{task.id}</span>
            {task.is_completed && <FiCheckCircle className="text-moss shrink-0" size={14} />}
          </div>

          <p
            className={cn(
              'mt-1 text-sm font-medium leading-snug text-ink',
              task.is_completed && 'line-through text-ink-faint'
            )}
          >
            {task.title}
          </p>

          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              {task.due_date && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-[11px] font-mono',
                    overdue ? 'text-coral' : 'text-ink-faint'
                  )}
                >
                  <FiCalendar size={11} />
                  {formatDueDate(task.due_date)}
                </span>
              )}
            </div>
            {assigneeName && <Avatar name={assigneeName} size="xs" />}
          </div>
        </div>
      )}
    </Draggable>
  );
}
