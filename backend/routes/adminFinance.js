import express from 'express';
import adminFinanceController from '../controllers/adminFinanceController.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyAdmin);

router.get('/stats', (req, res, next) => adminFinanceController.getDashboardStats(req, res, next));
router.get('/transactions', (req, res, next) => adminFinanceController.getTransactions(req, res, next));
router.get('/settings', (req, res, next) => adminFinanceController.getSettings(req, res, next));
router.put('/settings', (req, res, next) => adminFinanceController.updateSettings(req, res, next));

export default router;
