import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorkspaceRole } from '../middlewares/role.middleware';
import {
  createWorkspace,
  getMyWorkspaces,
  addWorkspaceMember,
  getWorkspaceMembers,
} from '../controllers/workspace.controller';

const router = Router();

router.use(authenticate); // all workspace routes require login

router.post('/', createWorkspace);
router.get('/', getMyWorkspaces);
router.post('/:workspaceId/members', requireWorkspaceRole('admin'), addWorkspaceMember);
router.get('/:workspaceId/members', getWorkspaceMembers);

export default router;
