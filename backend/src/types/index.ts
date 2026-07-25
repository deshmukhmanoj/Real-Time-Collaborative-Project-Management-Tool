export interface JwtPayload {
  userId: number;
  email: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface AuthUser {
  id: number;
  email: string;
}

export interface TaskPriority {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
