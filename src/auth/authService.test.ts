import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSignInWithCredential = vi.fn();
const mockCredential = vi.fn();
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: {
    credential: (...args: unknown[]) => mockCredential(...args)
  },
  signInWithPopup: vi.fn(),
  signInWithCredential: (...args: unknown[]) => mockSignInWithCredential(...args)
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args)
}));

vi.mock('../lib/firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

import { handleDeepLinkUrl, loginWithGoogleCredential } from './authService';

describe('authService deep link and credential login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores invalid deep link URLs', async () => {
    expect(await handleDeepLinkUrl('')).toBe(false);
    expect(await handleDeepLinkUrl('https://example.com')).toBe(false);
    expect(await handleDeepLinkUrl('custom://oauth?idToken=123')).toBe(false);
    expect(await handleDeepLinkUrl('com.yoogi.mindmap://oauth')).toBe(false);
  });

  it('successfully handles valid deep link with idToken', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    mockCredential.mockReturnValue({ providerId: 'google.com' });
    mockSignInWithCredential.mockResolvedValue({ user: mockUser });
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const url = 'com.yoogi.mindmap://oauth?idToken=mock-id-token&accessToken=mock-access-token';
    const result = await handleDeepLinkUrl(url);

    expect(result).toBe(true);
    expect(mockCredential).toHaveBeenCalledWith('mock-id-token', 'mock-access-token');
    expect(mockSignInWithCredential).toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalled();
  });

  it('handles existing user profile without overwriting createdAt', async () => {
    const mockUser = { uid: 'existing-uid', email: 'existing@example.com' };
    mockCredential.mockReturnValue({ providerId: 'google.com' });
    mockSignInWithCredential.mockResolvedValue({ user: mockUser });
    mockGetDoc.mockResolvedValue({ exists: () => true });

    await loginWithGoogleCredential('token-123');

    expect(mockCredential).toHaveBeenCalledWith('token-123', null);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
