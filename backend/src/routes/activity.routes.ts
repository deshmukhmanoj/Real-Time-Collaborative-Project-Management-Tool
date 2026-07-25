import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireTaskAccess, requireBoardAccess } from '../middlewares/role.middleware';
import { getTaskActivity, getBoardActivity } from '../controllers/activity.controller';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', requireTaskAccess(), getTaskActivity);
router.get('/board/:boardId', requireBoardAccess(), getBoardActivity);

export default router;
