import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY || '',  // 環境変数からAPIキーを取得、未設定時は空文字列
  baseURL: 'https://api.x.ai/v1',
});

export const generateSummary = async (text: string): Promise<string> => {
  try {
    const completion = await client.chat.completions.create({
      model: 'grok-3-mini-beta',
      messages: [
        {
          role: 'system',
          content: 'You are a highly intelligent AI assistant that summarizes academic papers.',
        },
        {
          role: 'user',
          content: `Summarize the following paper abstract: ${text}`,
        },
      ],
      reasoning_effort: 'high',  // 高度な思考を適用
    });

    return completion.choices[0].message.content || 'Summary not available';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Error generating summary';
  }
};
