import express from 'express';
import { getWalletInfo, depositMoney, requestWithdrawal, vnpayWebhook, vnpayReturnUrl } from '../controllers/wallet.controller.js';
import { verifyUser } from '../../../middlewares/authMiddleware.js';
import validate from '../../../middlewares/validate.js';
import { depositSchema, withdrawSchema } from '../validations/wallet.validation.js';

const router = express.Router();

// Webhook VNPay (không cần verifyUser vì VNP gọi thẳng)
router.get('/vnpay-ipn', vnpayWebhook);

// Return URL (VNPay redirect trình duyệt về đây sau khi thanh toán)
router.get('/vnpay-return', vnpayReturnUrl);

// Middleware xác thực user/tutor cho các API ví bên dưới
router.use(verifyUser);

router.get('/', getWalletInfo);
router.post('/deposit', validate(depositSchema), depositMoney);
router.post('/withdraw', validate(withdrawSchema), requestWithdrawal);

export default router;
