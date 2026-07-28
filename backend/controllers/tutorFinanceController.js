import tutorFinanceService from '../services/tutorFinanceService.js';

class TutorFinanceController {
  async getWalletAndHistory(req, res, next) {
    try {
      const tutorId = req.user.tutor_id || req.user.id;
      const data = await tutorFinanceService.getWalletAndHistory(tutorId);
      res.json({ status: 'ok', data });
    } catch (err) {
      next(err);
    }
  }

  async updateBankInfo(req, res, next) {
    try {
      const tutorId = req.user.tutor_id || req.user.id;
      const data = await tutorFinanceService.updateBankInfo(tutorId, req.body);
      res.json({ status: 'ok', message: 'Cập nhật tài khoản ngân hàng thành công!', data });
    } catch (err) {
      next(err);
    }
  }

  async requestPayout(req, res, next) {
    try {
      const tutorId = req.user.tutor_id || req.user.id;
      const { amount } = req.body;
      const data = await tutorFinanceService.requestPayout(tutorId, amount);
      res.json({ status: 'ok', message: 'Đã gửi yêu cầu rút tiền thành công! Vui lòng chờ Quản trị viên xử lý.', data });
    } catch (err) {
      next(err);
    }
  }
}

export default new TutorFinanceController();
