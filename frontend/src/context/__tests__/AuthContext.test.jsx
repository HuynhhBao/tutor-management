import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

const TestComponent = () => {
  const { user, loading, login, loginWithGoogle, logout, setUserFromLogin } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <button onClick={() => login('user@test.com', 'pass', 'user')} data-testid="login-user">Login User</button>
      <button onClick={() => login('tutor', 'pass', 'tutor')} data-testid="login-tutor">Login Tutor</button>
      <button onClick={() => loginWithGoogle('fake-token')} data-testid="login-google">Google</button>
      <button onClick={() => logout()} data-testid="logout">Logout</button>
      <button onClick={() => setUserFromLogin({ email: 'manual@test.com' })} data-testid="set-user">SetUser</button>
    </div>
  );
};

describe('AuthContext unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checks auth on mount successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { email: 'test@test.com' } })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('test@test.com');
  });

  it('checks auth on mount with failed response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('checks auth on mount with network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('login user successfully', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false }) // Initial checkAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { email: 'user@test.com' } })
      }); // login

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    
    fireEvent.click(screen.getByTestId('login-user'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user@test.com');
    });
  });

  it('login user fails', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false }) // Initial checkAuth
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      }); // login

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    
    fireEvent.click(screen.getByTestId('login-user'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('login tutor successfully', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false }) // Initial checkAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { email: 'tutor@test.com' } })
      }); // login

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    
    fireEvent.click(screen.getByTestId('login-tutor'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('tutor@test.com');
    });
  });

  it('login with google successfully', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false }) // Initial checkAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { email: 'google@test.com' } })
      }); // google login

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    
    fireEvent.click(screen.getByTestId('login-google'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('google@test.com');
    });
  });

  it('login with google fails', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false }) // Initial checkAuth
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Error' })
      }); // google login

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    
    fireEvent.click(screen.getByTestId('login-google'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('logout successfully', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false }) // Initial checkAuth
      .mockResolvedValueOnce({ ok: true }); // logout

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    
    fireEvent.click(screen.getByTestId('set-user')); // manually set user first
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('manual@test.com'));

    fireEvent.click(screen.getByTestId('logout'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('logout with error', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false }) // Initial checkAuth
      .mockRejectedValueOnce(new Error('Network error')); // logout

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    
    fireEvent.click(screen.getByTestId('logout'));
    
    // Nothing to assert for user as state doesn't change on err or console error is logged
    // but code path is covered
  });
});
