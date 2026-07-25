import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireBoardAccess, requireListAccess } from '../middlewares/role.middleware';
import { createList, reorderList, renameList, deleteList } from '../controllers/list.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireBoardAccess(), createList);
router.patch('/:id/reorder', requireListAccess(), reorderList);
router.patch('/:id', requireListAccess(), renameList);
router.delete('/:id', requireListAccess(), deleteList);

export default router;