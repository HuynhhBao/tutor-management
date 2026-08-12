/**
 * Tiện ích trung tâm hỗ trợ Việt hóa chuẩn xác và đồng bộ màu huy hiệu cho các trạng thái
 * trên toàn bộ nền tảng EduMatch (Admin, Tutor, Student).
 */

const STATUS_MAP = {
  // Hoàn thành / Giải ngân
  'completed': { label: 'Hoàn thành', color: 'emerald' },
  'hoàn thành': { label: 'Hoàn thành', color: 'emerald' },
  'approved': { label: 'Đã giải ngân', color: 'emerald' },
  'đã chi': { label: 'Đã giải ngân', color: 'emerald' },
  'đã giải ngân': { label: 'Đã giải ngân', color: 'emerald' },
  'thành công': { label: 'Đã giải ngân', color: 'emerald' },
  'active': { label: 'Hoạt động', color: 'emerald' },
  'đã duyệt': { label: 'Đã duyệt', color: 'emerald' },
  'sẵn sàng': { label: 'Sẵn sàng', color: 'emerald' },

  // Đang chạy / Đã xác nhận
  'confirmed': { label: 'Đã xác nhận', color: 'blue' },
  'đã xác nhận': { label: 'Đã xác nhận', color: 'blue' },
  'in_progress': { label: 'Đang chạy', color: 'blue' },
  'đang chạy': { label: 'Đang chạy', color: 'blue' },
  'running': { label: 'Đang chạy', color: 'blue' },

  // Chờ xác nhận / Chờ giải ngân
  'pending': { label: 'Chờ xác nhận', color: 'amber' },
  'chờ xác nhận': { label: 'Chờ xác nhận', color: 'amber' },
  'chờ xử lý': { label: 'Chờ xác nhận', color: 'amber' },
  'waiting': { label: 'Chờ xác nhận', color: 'amber' },
  'chờ duyệt': { label: 'Chờ xác nhận', color: 'amber' },
  'chờ giải ngân (pending)': { label: 'Chờ giải ngân', color: 'amber' },
  'chờ giải ngân': { label: 'Chờ giải ngân', color: 'amber' },

  // Đã hủy / Từ chối / Blocked
  'cancelled': { label: 'Đã hủy', color: 'rose' },
  'canceled': { label: 'Đã hủy', color: 'rose' },
  'đã hủy': { label: 'Đã hủy', color: 'rose' },
  'huỷ bỏ': { label: 'Đã hủy', color: 'rose' },
  'hủy': { label: 'Đã hủy', color: 'rose' },
  'rejected': { label: 'Bị từ chối', color: 'rose' },
  'bị từ chối': { label: 'Bị từ chối', color: 'rose' },
  'bị từ chối (rejected)': { label: 'Bị từ chối', color: 'rose' },
  'blocked': { label: 'Tạm ngưng', color: 'rose' },
  'khóa': { label: 'Tạm ngưng', color: 'rose' },
  'tinh chi': { label: 'Đã hủy', color: 'rose' },
};

export function formatStatus(status) {
  if (!status) {
    return { 
      label: 'N/A', 
      className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200' 
    };
  }

  const clean = String(status).toLowerCase().trim();
  const matched = STATUS_MAP[clean];

  if (matched) {
    return {
      label: matched.label,
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${matched.color}-50 text-${matched.color}-700 border border-${matched.color}-200`
    };
  }

  // Mặc định giữ nguyên nếu là chuỗi tiếng Việt chuẩn hoặc khác
  return {
    label: status,
    className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200'
  };
}
