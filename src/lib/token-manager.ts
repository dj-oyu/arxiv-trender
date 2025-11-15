/**
 * alphaXiv トークン管理ユーティリティ
 *
 * 環境変数からトークンを取得し、有効期限を管理します。
 */

/**
 * JWTトークンをデコードして情報を取得
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * トークンの有効期限をチェック
 */
export function isTokenValid(token: string): boolean {
  const decoded = decodeJWT(token);

  if (!decoded || !decoded.exp) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded.exp - now;

  // 5分以内に期限切れになる場合は無効とみなす
  return expiresIn > 300;
}

/**
 * トークン情報を取得
 */
export function getTokenInfo(token: string): {
  userId?: string;
  email?: string;
  expiresAt?: Date;
  expiresIn?: number; // seconds
  isValid: boolean;
} | null {
  const decoded = decodeJWT(token);

  if (!decoded) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded.exp ? decoded.exp - now : 0;

  return {
    userId: decoded.sub,
    email: decoded.email,
    expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : undefined,
    expiresIn: expiresIn,
    isValid: expiresIn > 300,
  };
}

/**
 * 環境変数からトークンを取得（サーバーサイドのみ）
 */
export function getAlphaXivToken(): string | undefined {
  // サーバーサイドでのみ実行
  if (typeof window !== 'undefined') {
    console.warn('getAlphaXivToken should only be called on server-side');
    return undefined;
  }

  const token = process.env.ALPHAXIV_API_TOKEN;

  if (!token) {
    return undefined;
  }

  // トークンの有効性をチェック
  if (!isTokenValid(token)) {
    console.warn('ALPHAXIV_API_TOKEN has expired. Please run "pnpm run get-token" to refresh.');
    return undefined;
  }

  return token;
}

/**
 * トークン情報をログ出力（デバッグ用）
 */
export function logTokenInfo(token: string): void {
  const info = getTokenInfo(token);

  if (!info) {
    console.log('❌ Invalid token');
    return;
  }

  console.log('🔑 Token Information:');
  console.log(`  - User ID: ${info.userId || 'N/A'}`);
  console.log(`  - Email: ${info.email || 'N/A'}`);
  console.log(`  - Expires at: ${info.expiresAt?.toLocaleString('ja-JP') || 'N/A'}`);
  console.log(`  - Expires in: ${Math.floor((info.expiresIn || 0) / 60)} minutes`);
  console.log(`  - Valid: ${info.isValid ? '✅' : '❌'}`);

  if (!info.isValid) {
    console.log('\n⚠️  Token is expired or will expire soon. Run "pnpm run get-token" to refresh.');
  }
}
