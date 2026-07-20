import express from 'express';
import { getAllClasses, getClassById, updateClassStatus } from '../controllers/adminClassController.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyAdmin);

router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.put('/:id/status', updateClassStatus);

export default router;
