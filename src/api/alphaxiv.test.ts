import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTrendingPapers, getAuthToken } from './alphaxiv';

describe('alphaXiv API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('fetchTrendingPapers', () => {
    it('should make request to v3 API without authentication', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ papers: [{ id: '1', title: 'Test' }] }),
      });

      await fetchTrendingPapers('agents');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('papers/v3/feed'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'accept': '*/*',
            'sec-fetch-mode': 'cors',
          }),
        })
      );
    });

    it('should work even when token parameter is provided (backwards compatibility)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ papers: [{ id: '1', title: 'Test' }] }),
      });

      await fetchTrendingPapers('agents', 'test-api-token');

      // v3 API doesn't use the token, but should still work
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('papers/v3/feed'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'accept': '*/*',
            'sec-fetch-mode': 'cors',
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await fetchTrendingPapers('agents', 'test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should parse v3 API response format', async () => {
      // v3 API format: { papers: [...] }
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ papers: [{ id: '1', title: 'Test Paper' }] }),
      });

      const result = await fetchTrendingPapers('agents');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('1');
    });
  });

  describe('getAuthToken', () => {
    it('should send correct request to alphaXiv auth API', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, apiKey: 'test-api-key' }),
      });

      const result = await getAuthToken('google-id-token-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.alphaxiv.org/v1/auth/login-google',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'google-id-token-123' }),
        }
      );

      expect(result.success).toBe(true);
      expect(result.apiKey).toBe('test-api-key');
    });

    it('should handle authentication failures', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await getAuthToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing apiKey in response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }), // apiKeyが欠けている
      });

      const result = await getAuthToken('test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No API key returned');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await getAuthToken('test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });
  });
});
