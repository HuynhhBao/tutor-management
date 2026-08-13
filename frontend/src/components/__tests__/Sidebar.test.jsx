import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import * as AuthContext from '../../context/AuthContext';

describe('Sidebar component unit tests', () => {
  const mockLogout = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { fullName: 'Quản Trị Viên', email: 'admin@edumatch.com', role: 'admin' },
      logout: mockLogout
    });

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ status: 'ok', data: { totalTutors: 10, pendingApplications: 5 } })
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders admin sidebar title and navigation links correctly', async () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('TutorAdmin')).toBeInTheDocument();
    expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    expect(screen.getByText('Quản lý Gia sư')).toBeInTheDocument();
    expect(screen.getByText('Quản lý Học viên')).toBeInTheDocument();
    expect(screen.getByText('Sắp xếp Lớp học')).toBeInTheDocument();
    expect(screen.getByText('Tài chính')).toBeInTheDocument();
  });

  it('displays pending applications badge when API returns positive count', async () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('toggles UserAccountMenu dropdown when clicking user account profile button', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Initially menu is closed
    expect(screen.queryByText('Đăng xuất')).toBeNull();

    // Click profile button to open menu
    const profileButton = screen.getByText('Quản Trị Viên').closest('button');
    fireEvent.click(profileButton);

    // Menu should open and show role/logout options
    expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
    expect(screen.getByText('Bảng điều khiển')).toBeInTheDocument();
    
    // Click logout to trigger onClose
    fireEvent.click(screen.getByText('Đăng xuất'));
    expect(screen.queryByText('Bảng điều khiển')).toBeNull();
  });

  it('logs error when fetchStats fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching sidebar stats:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});
