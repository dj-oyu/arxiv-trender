#!/usr/bin/env tsx
/**
 * alphaXivトークン取得スクリプト
 *
 * このスクリプトはPuppeteerを使用してalphaXivにログインし、
 * Clerkセッショントークンを取得して.env.localに保存します。
 *
 * 使い方:
 *   pnpm run get-token
 *
 * 手順:
 * 1. ブラウザが自動で起動します
 * 2. alphaXivのログインページが表示されます
 * 3. Googleアカウントでログインしてください
 * 4. ログイン完了後、トークンが自動的に取得・保存されます
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ALPHAXIV_URL = 'https://www.alphaxiv.org';
const LOGIN_URL = `${ALPHAXIV_URL}/login`;
const ENV_FILE = path.join(process.cwd(), '.env.local');

interface ClerkToken {
  token: string;
  expiresAt: number;
  userId?: string;
  email?: string;
}

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
 * .env.localファイルを更新
 */
function updateEnvFile(token: string): void {
  let envContent = '';

  // 既存の.env.localを読み込み
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  }

  // ALPHAXIV_API_TOKENの行を更新または追加
  const tokenLine = `ALPHAXIV_API_TOKEN=${token}`;

  if (envContent.includes('ALPHAXIV_API_TOKEN=')) {
    // 既存のトークン行を更新
    envContent = envContent.replace(
      /^#?\s*ALPHAXIV_API_TOKEN=.*/m,
      tokenLine
    );
  } else {
    // 新規追加
    envContent += `\n# alphaXiv APIトークン（自動取得）\n${tokenLine}\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent.trim() + '\n');
  console.log(`✅ トークンを ${ENV_FILE} に保存しました`);
}

/**
 * alphaXivからトークンを取得
 */
async function getAlphaXivToken(): Promise<ClerkToken | null> {
  console.log('🚀 alphaXivトークン取得を開始します...\n');

  const browser = await puppeteer.launch({
    headless: false, // ブラウザを表示してユーザーがログイン操作できるようにする
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    console.log(`📂 ${LOGIN_URL} にアクセスしています...`);
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    console.log('\n👉 ブラウザでGoogleアカウントを使ってログインしてください');
    console.log('   ログイン完了後、自動的にトークンが取得されます...\n');

    // ログイン完了を待機（ホームページまたはダッシュボードにリダイレクトされるまで）
    await page.waitForFunction(
      () => {
        return window.location.pathname !== '/login' &&
               window.location.pathname !== '/sign-in';
      },
      { timeout: 300000 } // 5分待機
    );

    console.log('✅ ログイン成功を検知しました');

    // 少し待機してセッションが確立されるのを待つ
    await page.waitForTimeout(2000);

    // Cookieからトークンを取得
    const cookies = await page.cookies();

    // Clerk関連のCookieを探す
    const clerkCookies = cookies.filter(cookie =>
      cookie.name.includes('clerk') ||
      cookie.name === '__session'
    );

    console.log('\n🔍 検出されたClerk関連Cookie:');
    clerkCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });

    // __session Cookieを優先的に使用
    let sessionToken = clerkCookies.find(c => c.name === '__session')?.value;

    // __sessionがない場合は、__clerk_db_jwtを試す
    if (!sessionToken) {
      sessionToken = clerkCookies.find(c => c.name.includes('clerk_db_jwt'))?.value;
    }

    if (!sessionToken) {
      console.error('❌ トークンが見つかりませんでした');
      console.log('\n利用可能なCookie:');
      cookies.forEach(cookie => console.log(`  ${cookie.name}`));
      return null;
    }

    // JWTをデコードして情報を取得
    const decoded = decodeJWT(sessionToken);

    if (decoded) {
      console.log('\n📋 トークン情報:');
      console.log(`  - Issuer: ${decoded.iss}`);
      console.log(`  - User ID: ${decoded.sub}`);
      console.log(`  - Email: ${decoded.email || 'N/A'}`);
      console.log(`  - Expires: ${new Date(decoded.exp * 1000).toLocaleString('ja-JP')}`);
      console.log(`  - Session ID: ${decoded.sid}`);
    }

    return {
      token: sessionToken,
      expiresAt: decoded?.exp || 0,
      userId: decoded?.sub,
      email: decoded?.email,
    };

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   alphaXiv トークン自動取得ツール');
  console.log('═══════════════════════════════════════════════════════\n');

  const result = await getAlphaXivToken();

  if (result) {
    console.log('\n✨ トークン取得成功！');
    updateEnvFile(result.token);

    console.log('\n📌 次のステップ:');
    console.log('  1. pnpm run dev でアプリを起動');
    console.log('  2. トークンは自動的に使用されます');

    if (result.expiresAt) {
      const expiresIn = Math.floor((result.expiresAt * 1000 - Date.now()) / 1000 / 60 / 60);
      console.log(`\n⏰ トークンの有効期限: 約${expiresIn}時間後`);
      if (expiresIn < 24) {
        console.log('   ⚠️  24時間以内に期限切れになります');
      }
    }
  } else {
    console.log('\n❌ トークン取得に失敗しました');
    console.log('   もう一度実行してください: pnpm run get-token');
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
