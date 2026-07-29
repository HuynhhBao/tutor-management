import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';

describe('PasswordStrengthIndicator component unit tests', () => {
  it('renders nothing when password prop is empty or undefined', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Rất yếu" for very simple passwords (score <= 1)', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText('Rất yếu')).toBeInTheDocument();
  });

  it('renders "Yếu" or "Trung bình" for moderate passwords', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="abcdef123" />);
    // score: length >= 8 (1), [a-z] (1), \d (1) => score 3 => Trung bình
    expect(screen.getByText('Trung bình')).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="abc123" />);
    // score: [a-z] (1), \d (1) => score 2 => Yếu
    expect(screen.getByText('Yếu')).toBeInTheDocument();
  });

  it('renders "Mạnh" for strong passwords (score 4)', () => {
    render(<PasswordStrengthIndicator password="Abcdef123" />);
    // length >= 8 (1), [a-z] (1), [A-Z] (1), \d (1) => score 4 => Mạnh
    expect(screen.getByText('Mạnh')).toBeInTheDocument();
  });

  it('renders "Rất mạnh" for complex secure passwords (score 5)', () => {
    render(<PasswordStrengthIndicator password="P@ssw0rd_123!" />);
    // all criteria met => score 5 => Rất mạnh
    expect(screen.getByText('Rất mạnh')).toBeInTheDocument();
  });
});
