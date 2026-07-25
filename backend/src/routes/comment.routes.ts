import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireTaskAccess } from '../middlewares/role.middleware';
import { addComment, getTaskComments } from '../controllers/comment.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireTaskAccess(), addComment);
router.get('/task/:taskId', requireTaskAccess(), getTaskComments);

export default router;
