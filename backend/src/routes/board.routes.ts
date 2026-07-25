import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorkspaceRole, requireBoardAccess } from '../middlewares/role.middleware';
import { createBoard, getWorkspaceBoards, getBoardFull } from '../controllers/board.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireWorkspaceRole('member'), createBoard);
router.get('/workspace/:workspaceId', requireWorkspaceRole('member'), getWorkspaceBoards);
router.get('/:id/full', requireBoardAccess(), getBoardFull);

export default router;
