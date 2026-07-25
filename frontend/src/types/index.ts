export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface Workspace {
  id: number;
  name: string;
  role: WorkspaceRole;
}

export interface WorkspaceMember {
  user_id: number;
  name: string;
  email: string;
  role: WorkspaceRole;
}

export interface Board {
  id: number;
  title: string;
  created_at?: string;
}

export interface Task {
  id: number;
  list_id: number;
  board_id: number;
  title: string;
  description: string | null;
  assigned_to: number | null;
  created_by: number;
  due_date: string | null;
  priority: TaskPriority;
  position: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListColumn {
  id: number;
  title: string;
  position: number;
  tasks: Task[];
}

export interface BoardFull {
  board_id: number;
  title: string;
  lists: ListColumn[];
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  user_name: string;
  created_at: string;
}

export interface ActivityItem {
  id: number;
  action: string;
  user_name: string;
  created_at: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
}
