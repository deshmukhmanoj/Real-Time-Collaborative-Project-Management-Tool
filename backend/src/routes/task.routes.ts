import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireBoardAccess, requireTaskAccess } from '../middlewares/role.middleware';
import {
  createTask,
  updateTask,
  moveTask,
  toggleTaskComplete,
  deleteTask,
} from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireBoardAccess(), createTask);
router.patch('/:id', requireTaskAccess(), updateTask);
router.patch('/:id/move', requireTaskAccess(), moveTask);
router.patch('/:id/complete', requireTaskAccess(), toggleTaskComplete);
router.delete('/:id', requireTaskAccess(), deleteTask);

export default router;
