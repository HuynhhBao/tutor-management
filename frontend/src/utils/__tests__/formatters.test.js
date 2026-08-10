import { describe, it, expect } from 'vitest';
import { formatDateTime, formatDate, formatCurrency } from '../formatters';

describe('formatters utility unit tests', () => {
  describe('formatDateTime', () => {
    it('returns empty string if datetimeStr is null or undefined', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime(undefined)).toBe('');
      expect(formatDateTime('')).toBe('');
    });

    it('formats valid datetime strings correctly', () => {
      const dt = '2026-07-29T08:30:00Z';
      const result = formatDateTime(dt);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatDate', () => {
    it('returns empty string if dateStr is null or undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('')).toBe('');
    });

    it('formats valid date string into localized representation', () => {
      const dateStr = '2026-07-29';
      const result = formatDate(dateStr);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatCurrency', () => {
    it('returns empty string when amount is undefined or null', () => {
      expect(formatCurrency(undefined)).toBe('');
      expect(formatCurrency(null)).toBe('');
    });

    it('formats integer amount into VND currency string', () => {
      const result = formatCurrency(500000);
      expect(typeof result).toBe('string');
      // Replace non-breaking spaces if any and check numbers/symbol
      expect(result.replace(/\s| /g, '')).toContain('500.000');
    });

    it('handles 0 correctly', () => {
      const result = formatCurrency(0);
      expect(result).not.toBe('');
      expect(result).toContain('0');
    });

    it('handles negative currency values correctly', () => {
      const result = formatCurrency(-50000);
      expect(result).toContain('50.000');
    });
  });
});
