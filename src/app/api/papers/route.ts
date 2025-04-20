import { fetchTrendingPapers } from '../../../api/alphaxiv';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'agents';
    const token = url.searchParams.get('token') || process.env.ALPHAXIV_API_TOKEN || '';

    console.log('Fetching papers with category:', category); // デバッグ用
    const data = await fetchTrendingPapers(category, token);
    console.log('API Response:', data); // デバッグ用
    return new Response(JSON.stringify(data), { status: data.success ? 200 : 500 });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return new Response(JSON.stringify({ success: false, data: [], error: error.message }), { status: 500 });
  }
}
