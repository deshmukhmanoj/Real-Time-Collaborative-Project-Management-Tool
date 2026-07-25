import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { lookupUserByEmail } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/lookup', lookupUserByEmail);

export default router;
