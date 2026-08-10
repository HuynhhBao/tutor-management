import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import UserAccountMenu from '../UserAccountMenu';

describe('UserAccountMenu component unit tests', () => {
  const mockLogout = vi.fn();
  const mockClose = vi.fn();

  const renderMenu = (userProp, position = 'bottom') => {
    return render(
      <MemoryRouter>
        <UserAccountMenu
          user={userProp}
          onLogout={mockLogout}
          onClose={mockClose}
          position={position}
        />
      </MemoryRouter>
    );
  };

  it('renders correct label and links for admin role', () => {
    renderMenu({ fullName: 'Super Admin', role: 'admin' });
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument();

    const dashboardLink = screen.getByText('Bảng điều khiển').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/admin');
  });

  it('renders correct dashboard link for tutor role', () => {
    renderMenu({ fullName: 'Gia Sư Toán', role: 'tutor' });
    expect(screen.getByText('Gia sư')).toBeInTheDocument();

    const dashboardLink = screen.getByText('Bảng điều khiển').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/tutor-dashboard');
  });

  it('renders default user label for student role', () => {
    renderMenu({ fullName: 'Học Viên A', role: 'student' });
    expect(screen.getByText('Tài khoản cá nhân')).toBeInTheDocument();

    const dashboardLink = screen.getByText('Bảng điều khiển').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/student-dashboard');
  });

  it('triggers onLogout and onClose when clicking logout button', async () => {
    const user = userEvent.setup();
    renderMenu({ fullName: 'Test User', role: 'student' });

    const logoutBtn = screen.getByText('Đăng xuất');
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
