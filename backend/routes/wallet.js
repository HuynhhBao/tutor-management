import express from 'express';
import { getWalletInfo, depositMoney } from '../controllers/walletController.js';
import { verifyUser } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { depositSchema } from '../validations/walletValidation.js';

const router = express.Router();

// Middleware xác thực user
router.use(verifyUser);

router.get('/', getWalletInfo);
router.post('/deposit', validate(depositSchema), depositMoney);

export default router;
