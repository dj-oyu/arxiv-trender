import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { getAuthToken } from '../../../api/alphaxiv';

// getAuthTokenをモック化
vi.mock('../../../api/alphaxiv', () => ({
  getAuthToken: vi.fn(),
}));

describe('POST /api/auth', () => {
  it('should return auth token successfully', async () => {
    const mockApiKey = 'test-api-key';
    (getAuthToken as any).mockResolvedValue({ success: true, apiKey: mockApiKey });

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: 'test-google-token' }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.apiKey).toBe(mockApiKey);
  });

  it('should return 400 if googleToken is missing', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe('Google Token is required');
  });

  it('should handle errors when authentication fails', async () => {
    (getAuthToken as any).mockResolvedValue({ success: false, error: 'Auth Error' });

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: 'test-google-token' }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Auth Error');
  });

  it('should handle exceptions during authentication', async () => {
    (getAuthToken as any).mockRejectedValue(new Error('Network Error'));

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: 'test-google-token' }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Network Error');
  });
});
