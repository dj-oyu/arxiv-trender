import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTrendingPapers, getAuthToken } from './alphaxiv';

describe('alphaXiv API Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('fetchTrendingPapers', () => {
    it('should make request without Authorization header when token is not provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { trending_papers: [{ id: '1', title: 'Test' }] } }),
      });

      await fetchTrendingPapers('agents');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.alphaxiv.org'),
        expect.objectContaining({
          headers: {},
        })
      );
    });

    it('should include Authorization header when token is provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { trending_papers: [{ id: '1', title: 'Test' }] } }),
      });

      await fetchTrendingPapers('agents', 'test-api-token');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.alphaxiv.org'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-api-token' },
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

    it('should parse various response formats', async () => {
      // data.data.trending_papers形式
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { trending_papers: [{ id: '1' }] } }),
      });

      const result1 = await fetchTrendingPapers('agents');
      expect(result1.success).toBe(true);
      expect(Array.isArray(result1.data)).toBe(true);
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
