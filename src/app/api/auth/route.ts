import { getAuthToken } from '../../../api/alphaxiv';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const googleToken = body.googleToken || body.token;
    if (!googleToken) {
      return new Response(JSON.stringify({ error: 'Google Token is required' }), { status: 400 });
    }

    console.log('Sending Google Token to alphaXiv API:', googleToken.substring(0, 10) + '...'); // デバッグ用
    const result = await getAuthToken(googleToken);
    console.log('alphaXiv API Response:', result); // デバッグ用
    return new Response(JSON.stringify(result), { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('Error in authentication:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
