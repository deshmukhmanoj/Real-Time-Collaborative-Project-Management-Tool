import { Router } from 'express';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';
import boardRoutes from './board.routes';
import listRoutes from './list.routes';
import taskRoutes from './task.routes';
import commentRoutes from './comment.routes';
import activityRoutes from './activity.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/boards', boardRoutes);
router.use('/lists', listRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/activity', activityRoutes);
router.use('/users', userRoutes);

export default router;
