import { describe, it, expect } from 'vitest';
import { getAvatarUrl } from '../avatar';

describe('getAvatarUrl utility unit tests', () => {
  it('returns data URI unchanged when provided in avatarUrl', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    expect(getAvatarUrl(dataUri, 'John Doe', 'user')).toBe(dataUri);
  });

  it('returns full http/https URLs unchanged', () => {
    const httpUrl = 'http://example.com/avatar.jpg';
    const httpsUrl = 'https://example.com/avatar.png';
    expect(getAvatarUrl(httpUrl, 'Jane Doe')).toBe(httpUrl);
    expect(getAvatarUrl(httpsUrl, 'Jane Doe')).toBe(httpsUrl);
  });

  it('prepends localhost:3001 to relative avatar URLs from backend', () => {
    const relativePath = '/uploads/avatars/user-123.jpg';
    expect(getAvatarUrl(relativePath, 'User', 'user')).toBe('http://localhost:3001/uploads/avatars/user-123.jpg');
  });

  it('returns UI-Avatars fallback with blue theme for default user role when avatarUrl is null/empty', () => {
    const fallback = getAvatarUrl(null, 'Huynh Bao', 'user');
    expect(fallback).toContain('https://ui-avatars.com/api/?name=Huynh%20Bao');
    expect(fallback).toContain('background=dbeafe');
    expect(fallback).toContain('color=1d4ed8');
  });

  it('returns UI-Avatars fallback with indigo theme for tutor role', () => {
    const fallback = getAvatarUrl('', 'Tutor Test', 'tutor');
    expect(fallback).toContain('background=e0e7ff');
    expect(fallback).toContain('color=4338ca');
  });

  it('returns UI-Avatars fallback with purple theme for admin role', () => {
    const fallback = getAvatarUrl(null, 'Super Admin', 'admin');
    expect(fallback).toContain('background=f3e8ff');
    expect(fallback).toContain('color=7e22ce');
  });

  it('handles empty or whitespace name safely by defaulting to User', () => {
    const fallback = getAvatarUrl(null, '   ', 'user');
    expect(fallback).toContain('name=User');
  });
});
