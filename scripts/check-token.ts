#!/usr/bin/env tsx
/**
 * alphaXivトークン確認スクリプト
 *
 * .env.localに保存されているトークンの情報を表示します。
 *
 * 使い方:
 *   pnpm run check-token
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const ENV_FILE = path.join(process.cwd(), '.env.local');

interface TokenInfo {
  userId?: string;
  email?: string;
  expiresAt?: Date;
  expiresIn?: number;
  issuer?: string;
  sessionId?: string;
}

/**
 * JWTトークンをデコード
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
 * トークン情報を取得
 */
function getTokenInfo(token: string): TokenInfo | null {
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
    issuer: decoded.iss,
    sessionId: decoded.sid,
  };
}

/**
 * 時間を人間が読みやすい形式に変換
 */
function formatDuration(seconds: number): string {
  if (seconds < 0) return '期限切れ';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `約${days}日`;
  } else if (hours > 0) {
    return `約${hours}時間${minutes}分`;
  } else {
    return `約${minutes}分`;
  }
}

/**
 * メイン処理
 */
function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   alphaXiv トークン確認ツール');
  console.log('═══════════════════════════════════════════════════════\n');

  // .env.localを読み込み
  if (!fs.existsSync(ENV_FILE)) {
    console.log('❌ .env.local ファイルが見つかりません');
    console.log('\n📝 次のステップ:');
    console.log('  pnpm run get-token を実行してトークンを取得してください\n');
    process.exit(1);
  }

  const envConfig = dotenv.parse(fs.readFileSync(ENV_FILE));
  const token = envConfig.ALPHAXIV_API_TOKEN;

  if (!token) {
    console.log('❌ ALPHAXIV_API_TOKEN が設定されていません');
    console.log('\n📝 次のステップ:');
    console.log('  pnpm run get-token を実行してトークンを取得してください\n');
    process.exit(1);
  }

  console.log('✅ トークンが見つかりました\n');
  console.log('📋 トークン情報:');
  console.log(`  - 長さ: ${token.length} 文字`);
  console.log(`  - プレビュー: ${token.substring(0, 30)}...${token.substring(token.length - 10)}\n`);

  const info = getTokenInfo(token);

  if (!info) {
    console.log('❌ トークンのデコードに失敗しました');
    console.log('   トークンの形式が正しくない可能性があります\n');
    process.exit(1);
  }

  console.log('🔍 詳細情報:');
  console.log(`  - 発行元: ${info.issuer || 'N/A'}`);
  console.log(`  - ユーザーID: ${info.userId || 'N/A'}`);
  console.log(`  - メール: ${info.email || 'N/A'}`);
  console.log(`  - セッションID: ${info.sessionId || 'N/A'}`);

  if (info.expiresAt) {
    console.log(`\n⏰ 有効期限:`);
    console.log(`  - 期限日時: ${info.expiresAt.toLocaleString('ja-JP')}`);
    console.log(`  - 残り時間: ${formatDuration(info.expiresIn || 0)}`);

    if ((info.expiresIn || 0) <= 0) {
      console.log('\n❌ トークンの有効期限が切れています');
      console.log('\n📝 次のステップ:');
      console.log('  pnpm run get-token を実行して新しいトークンを取得してください');
    } else if ((info.expiresIn || 0) < 3600) {
      console.log('\n⚠️  トークンは1時間以内に期限切れになります');
      console.log('\n📝 推奨:');
      console.log('  pnpm run get-token を実行して新しいトークンを取得することをお勧めします');
    } else if ((info.expiresIn || 0) < 86400) {
      console.log('\n⚠️  トークンは24時間以内に期限切れになります');
    } else {
      console.log('\n✅ トークンは有効です');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

main();
