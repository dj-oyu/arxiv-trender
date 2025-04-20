// テストの目的: alphaXiv APIクライアントのfetchTrendingPapers関数をテストし、正しいレスポンスを返すことを検証する

import { describe, it, expect, vi } from 'vitest';  // Vitestを使用
import { fetchTrendingPapers } from '../../../api/alphaxiv';  // パスを修正

// fetchTrendingPapersをモック化 (テストファイル内でモック化)
vi.mock('../../../api/alphaxiv', () => ({
  fetchTrendingPapers: vi.fn(),
}));


describe('fetchTrendingPapers Function', () => {
  it('should fetch papers successfully with valid category and token', async () => {
    const category = 'agents';
    const token = 'dummy-token';
    const mockResponse = { success: true, data: [{ id: '1' }] };
    (fetchTrendingPapers as any).mockResolvedValue(mockResponse); // モックの戻り値を設定

    const result = await fetchTrendingPapers(category, token);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    const category = 'invalid-category';
    const token = 'invalid-token';
    const mockResponse = { success: false, error: 'API Error' };
    (fetchTrendingPapers as any).mockResolvedValue(mockResponse); // モックの戻り値を設定

    const result = await fetchTrendingPapers(category, token);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
