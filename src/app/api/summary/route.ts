import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';

// pdf.worker.mjsのパスを設定 (ローカルパスを使用)
const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY || '',  // 環境変数からAPIキーを取得
  baseURL: 'https://api.x.ai/v1',
});

async function extractTextFromPdf(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`
    });
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
    }
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { paperId } = await req.json();
    if (!paperId) {
      return new Response(JSON.stringify({ error: 'Paper ID is required' }), { status: 400 });
    }

    const pdfUrl = `https://papers-pdfs.assets.alphaxiv.org/${paperId}v1.pdf`;
    const paperText = await extractTextFromPdf(pdfUrl);

    if (!paperText) {
      return new Response(JSON.stringify({ error: 'Failed to extract text from PDF' }), { status: 500 });
    }

    const stream = await client.chat.completions.create({
      model: 'grok-3-mini-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a highly intelligent AI assistant that summarizes academic papers in Japanese.',
        },
        {
          role: 'user',
          content: 
`以下の論文本文を日本語で要約してください:
- 要約本文から書き始めること
- 本文と無関係な出力は禁止
- 箇条書き、セクション分割を使って論文の議論の流れを再現すること
- です・ます調でなくZ世代の若者のようなフランクな口調
${paperText.substring(0, 10000)}`, // 長すぎる場合は切り詰める
        },
      ],
      reasoning_effort: 'high',  // 高度な思考を適用
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      }
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(JSON.stringify({ error: 'Error generating summary: ' + error.message }), { status: 500 });
  }
}
