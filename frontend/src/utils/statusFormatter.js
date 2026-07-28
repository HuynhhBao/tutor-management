/**
 * Tiện ích trung tâm hỗ trợ Việt hóa chuẩn xác và đồng bộ màu huy hiệu cho các trạng thái
 * trên toàn bộ nền tảng EduMatch (Admin, Tutor, Student).
 */

export function formatStatus(status) {
  if (!status) return { label: 'N/A', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200' };

  const clean = String(status).toLowerCase().trim();

  // Nhóm Trạng thái Hoàn thành / Giải ngân / Duyệt chi / Sẵn sàng
  if (['completed', 'hoàn thành', 'approved', 'đã chi', 'đã duyệt', 'active', 'sẵn sàng', 'đã giải ngân', 'thành công'].includes(clean)) {
    let label = 'Hoàn thành';
    if (['approved', 'đã chi', 'đã giải ngân', 'thành công'].includes(clean)) label = 'Đã giải ngân';
    else if (['active', 'đã duyệt', 'sẵn sàng'].includes(clean)) label = clean === 'active' ? 'Hoạt động' : (clean === 'sẵn sàng' ? 'Sẵn sàng' : 'Đã duyệt');
    
    return {
      label,
      className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
    };
  }

  // Nhóm Trạng thái Đang chạy / Đang diễn ra / Đã xác nhận
  if (['confirmed', 'in_progress', 'đang chạy', 'đã xác nhận', 'running'].includes(clean)) {
    let label = 'Đã xác nhận';
    if (clean === 'in_progress' || clean === 'đang chạy' || clean === 'running') label = 'Đang chạy';
    else if (clean === 'confirmed') label = 'Đã xác nhận';

    return {
      label,
      className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200'
    };
  }

  // Nhóm Trạng thái Chờ xác nhận / Chờ giải ngân / Pending
  if (['pending', 'chờ giải ngân (pending)', 'chờ xác nhận', 'chờ giải ngân', 'chờ xử lý', 'waiting', 'chờ duyệt'].includes(clean)) {
    let label = 'Chờ xác nhận';
    if (clean.includes('giải ngân') || clean === 'chờ giải ngân') label = 'Chờ giải ngân';

    return {
      label,
      className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200'
    };
  }

  // Nhóm Trạng thái Đã hủy / Từ chối / Blocked
  if (['cancelled', 'canceled', 'đã hủy', 'huỷ bỏ', 'hủy', 'rejected', 'bị từ chối', 'bị từ chối (rejected)', 'blocked', 'khóa', 'tinh chi'].includes(clean)) {
    let label = 'Đã hủy';
    if (clean.includes('từ chối') || clean === 'rejected') label = 'Bị từ chối';
    if (clean === 'blocked' || clean === 'khóa') label = 'Tạm ngưng';

    return {
      label,
      className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200'
    };
  }

  // Mặc định giữ nguyên nếu là chuỗi tiếng Việt chuẩn hoặc khác
  return {
    label: status,
    className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200'
  };
}
