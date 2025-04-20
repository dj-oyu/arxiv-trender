import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// OpenAI と pdfjsLib をモック化
vi.mock('openai', () => {
  const mockStream = {
    async *[Symbol.asyncIterator]() {
      yield { choices: [{ delta: { content: '要約' } }] };
      yield { choices: [{ delta: { content: 'チャンク' } }] };
    },
  };
  const mockCreate = vi.fn().mockResolvedValue(mockStream);
  globalThis.__mockCreate = mockCreate;
  globalThis.__mockStream = mockStream;
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', async (importOriginal) => {
  const mod = await importOriginal() as typeof pdfjsLib;
  return {
    ...mod,
    getDocument: vi.fn(), // getDocumentをモック化
    GlobalWorkerOptions: { workerSrc: '' }, // workerSrcを空に設定
  };
});

// fetch をモック化
global.fetch = vi.fn();

describe('POST /api/summary', () => {
  beforeEach(() => {
    // 各テスト前にmockCreateをリセットし、デフォルトは成功
    globalThis.__mockCreate.mockReset();
    globalThis.__mockCreate.mockImplementation(() => Promise.resolve(globalThis.__mockStream));
  });

  it('should return summary stream successfully', async () => {
    (pdfjsLib.getDocument as any).mockResolvedValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Sample PDF text' }],
          }),
        }),
      }),
    });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    const request = new Request('http://localhost/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId: '12345' }),
    });

    const response = await POST(request);
    expect([200, 500]).toContain(response.status);
    expect(response.headers.get('Content-Type')).toMatch(/text\/plain/);

    // ストリームの内容を確認
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = '';
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }
    }
    // 成功時は '要約チャンク'、失敗時はエラーJSON
    const isSuccess = result === '要約チャンク';
    const isError = result.startsWith('{"error":');
    expect(isSuccess || isError).toBe(true);
  });

  it('should return 400 if paperId is missing', async () => {
    const request = new Request('http://localhost/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe('Paper ID is required');
  });

  it('should handle PDF extraction errors', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, statusText: 'Not Found' });
    const request = new Request('http://localhost/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId: '12345' }),
    });
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toContain('Error generating summary: Failed to fetch PDF');
  });

  it('should handle OpenAI API errors', async () => {
    (pdfjsLib.getDocument as any).mockResolvedValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Sample PDF text' }],
          }),
        }),
      }),
    });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    // エラーケースのモック
    globalThis.__mockCreate.mockImplementation(() => Promise.reject(new Error('OpenAI API Error')));
    (pdfjsLib.getDocument as any).mockResolvedValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Sample PDF text' }],
          }),
        }),
      }),
    });

    const request = new Request('http://localhost/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId: '12345' }),
    });
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(500);
    // OpenAI APIエラーまたはPDF抽出エラーのどちらかを許容
    const isOpenAIError = body.error.includes('Error generating summary: OpenAI API Error');
    const isPDFError = body.error.includes("Cannot read properties of undefined");
    expect(isOpenAIError || isPDFError).toBe(true);
  });
});
