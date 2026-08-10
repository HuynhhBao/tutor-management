import { describe, it, expect } from 'vitest';
import { formatStatus } from '../statusFormatter';

describe('statusFormatter utility unit tests', () => {
  it('returns N/A and gray badge when status is empty, null or undefined', () => {
    const resNull = formatStatus(null);
    expect(resNull.label).toBe('N/A');
    expect(resNull.className).toContain('bg-gray-50 text-gray-600');

    expect(formatStatus('')).toEqual(resNull);
    expect(formatStatus(undefined)).toEqual(resNull);
  });

  describe('Completed / Approved / Active group (Emerald badge)', () => {
    it('formats completed status correctly', () => {
      const res = formatStatus('completed');
      expect(res.label).toBe('Hoàn thành');
      expect(res.className).toContain('bg-emerald-50 text-emerald-700');
    });

    it('formats approved and payout statuses', () => {
      expect(formatStatus('approved').label).toBe('Đã giải ngân');
      expect(formatStatus('đã giải ngân').label).toBe('Đã giải ngân');
      expect(formatStatus('thành công').label).toBe('Đã giải ngân');
    });

    it('formats active status', () => {
      const res = formatStatus('active');
      expect(res.label).toBe('Hoạt động');
      expect(res.className).toContain('bg-emerald-50 text-emerald-700');
    });
  });

  describe('Confirmed / In Progress group (Blue badge)', () => {
    it('formats confirmed status correctly', () => {
      const res = formatStatus('confirmed');
      expect(res.label).toBe('Đã xác nhận');
      expect(res.className).toContain('bg-blue-50 text-blue-700');
    });

    it('formats in_progress and running statuses', () => {
      expect(formatStatus('in_progress').label).toBe('Đang chạy');
      expect(formatStatus('running').label).toBe('Đang chạy');
      expect(formatStatus('đang chạy').label).toBe('Đang chạy');
    });
  });

  describe('Pending / Waiting group (Amber badge)', () => {
    it('formats pending status correctly', () => {
      const res = formatStatus('pending');
      expect(res.label).toBe('Chờ xác nhận');
      expect(res.className).toContain('bg-amber-50 text-amber-700');
    });

    it('formats payout pending status correctly', () => {
      const res = formatStatus('chờ giải ngân');
      expect(res.label).toBe('Chờ giải ngân');
      expect(res.className).toContain('bg-amber-50 text-amber-700');
    });
  });

  describe('Cancelled / Rejected / Blocked group (Rose badge)', () => {
    it('formats cancelled status correctly', () => {
      const res = formatStatus('cancelled');
      expect(res.label).toBe('Đã hủy');
      expect(res.className).toContain('bg-rose-50 text-rose-700');
    });

    it('formats rejected status correctly', () => {
      const res = formatStatus('rejected');
      expect(res.label).toBe('Bị từ chối');
      expect(res.className).toContain('bg-rose-50 text-rose-700');
    });

    it('formats blocked and khóa statuses correctly', () => {
      expect(formatStatus('blocked').label).toBe('Tạm ngưng');
      expect(formatStatus('khóa').label).toBe('Tạm ngưng');
    });
  });

  describe('Fallback / Custom string group (Slate badge)', () => {
    it('returns raw status string with slate default badge for unknown status', () => {
      const res = formatStatus('Đang chờ thi cử');
      expect(res.label).toBe('Đang chờ thi cử');
      expect(res.className).toContain('bg-slate-50 text-slate-700');
    });
  });
});
