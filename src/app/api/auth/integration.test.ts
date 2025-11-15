import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// 実際のalphaXiv APIの動作をシミュレートする統合テスト
describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    // グローバルfetchをモック化
    global.fetch = vi.fn();
  });

  it('should successfully authenticate through the complete flow', async () => {
    // alphaXiv APIのレスポンスをモック
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, apiKey: 'mock-api-key-from-alphaxiv' }),
    });

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: 'valid-google-id-token' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.apiKey).toBe('mock-api-key-from-alphaxiv');

    // alphaXiv APIが正しいエンドポイントとパラメータで呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.alphaxiv.org/v1/auth/login-google',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-google-id-token' }),
      })
    );
  });

  it('should handle alphaXiv API failures correctly', async () => {
    // alphaXiv APIがエラーを返す場合
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: 'invalid-google-token' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('should handle network errors gracefully', async () => {
    // ネットワークエラーをシミュレート
    (global.fetch as any).mockRejectedValueOnce(new Error('Network connection failed'));

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: 'test-token' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Network connection failed');
  });

  it('should handle malformed alphaXiv API responses', async () => {
    // alphaXiv APIが不正なレスポンスを返す場合
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }), // apiKeyが欠けている
    });

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: 'test-token' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('should validate request body before calling alphaXiv API', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // googleTokenが欠けている
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Google Token is required');
    // alphaXiv APIが呼ばれていないことを確認
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
