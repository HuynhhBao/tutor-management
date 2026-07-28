import express from 'express';
import tutorFinanceController from '../controllers/tutorFinanceController.js';
import { verifyTutor } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyTutor);

router.get('/', (req, res, next) => tutorFinanceController.getWalletAndHistory(req, res, next));
router.put('/bank', (req, res, next) => tutorFinanceController.updateBankInfo(req, res, next));
router.post('/payout', (req, res, next) => tutorFinanceController.requestPayout(req, res, next));

export default router;
