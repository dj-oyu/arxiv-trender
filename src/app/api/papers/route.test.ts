import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { fetchTrendingPapers } from '../../../api/alphaxiv';

// fetchTrendingPapersをモック化
vi.mock('../../../api/alphaxiv', () => ({
  fetchTrendingPapers: vi.fn(),
}));

describe('GET /api/papers', () => {
  it('should return trending papers successfully', async () => {
    const mockPapers = [{ id: '1', title: 'Test Paper' }];
    (fetchTrendingPapers as any).mockResolvedValue({ success: true, data: mockPapers });

    const request = new Request('http://localhost/api/papers?category=test');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockPapers);
  });

  it('should handle errors when fetching papers fails', async () => {
    (fetchTrendingPapers as any).mockResolvedValue({ success: false, error: 'API Error' });

    const request = new Request('http://localhost/api/papers?category=test');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('API Error');
  });

  it('should handle exceptions during fetch', async () => {
    (fetchTrendingPapers as any).mockRejectedValue(new Error('Network Error'));

    const request = new Request('http://localhost/api/papers?category=test');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Network Error');
  });
});
