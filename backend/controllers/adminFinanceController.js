import adminFinanceService from '../services/adminFinanceService.js';

class AdminFinanceController {
  async getDashboardStats(req, res, next) {
    try {
      const { period = '30d' } = req.query;
      const stats = await adminFinanceService.getDashboardStats(period);
      res.json({
        status: 'ok',
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const { page, limit, search, type, startDate, endDate } = req.query;
      const result = await adminFinanceService.getTransactions({
        page,
        limit,
        search,
        type,
        startDate,
        endDate
      });
      res.json({
        status: 'ok',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getSettings(req, res, next) {
    try {
      const settings = await adminFinanceService.getSettings();
      res.json({
        status: 'ok',
        data: settings
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const { commissionRate } = req.body;
      const updated = await adminFinanceService.updateCommissionRate(commissionRate);
      res.json({
        status: 'ok',
        message: 'Cập nhật tỷ lệ hoa hồng thành công',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async getTutorsFinanceOverview(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await adminFinanceService.getTutorsFinanceOverview({ search, page, limit });
      res.json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPayoutRequests(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const result = await adminFinanceService.getPayoutRequests({ status, page, limit });
      res.json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  }

  async processPayoutRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { action, adminNote } = req.body;
      const result = await adminFinanceService.processPayoutRequest(id, action, adminNote);
      res.json({ status: 'ok', message: action === 'approve' ? 'Đã phê duyệt và thanh toán thành công!' : 'Đã từ chối yêu cầu.', data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSystemOverviewStats(req, res, next) {
    try {
      const result = await adminFinanceService.getSystemOverviewStats();
      res.json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminFinanceController();
