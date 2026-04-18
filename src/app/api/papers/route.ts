import { fetchTrendingPapers } from '../../../api/alphaxiv';
import { getAlphaXivToken, getTokenInfo } from '../../../lib/token-manager';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'agents';

    // トークンの取得順序:
    // 1. クエリパラメータから
    // 2. 環境変数から（有効期限チェック付き）
    let token = url.searchParams.get('token') || getAlphaXivToken() || '';

    // トークンが存在する場合、有効性を確認してログ出力
    if (token) {
      const tokenInfo = getTokenInfo(token);
      if (tokenInfo && !tokenInfo.isValid) {
        console.warn('⚠️  Token is expired or will expire soon. Please run "pnpm run get-token" to refresh.');
      }
    }

    console.log('Fetching papers with category:', category);
    console.log('Using token:', token ? `${token.substring(0, 20)}... (${token.length} chars)` : 'none');

    const data = await fetchTrendingPapers(category, token);
    console.log('API Response:', data);
    return new Response(JSON.stringify(data), { status: data.success ? 200 : 500 });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return new Response(JSON.stringify({ success: false, data: [], error: error.message }), { status: 500 });
  }
}
