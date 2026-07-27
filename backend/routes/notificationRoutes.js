import express from 'express';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController.js';
import { verifyAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyAuth);

router.get('/', getMyNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

export default router;
