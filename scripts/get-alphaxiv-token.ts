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

    // ポップアップウィンドウを監視
    let popupPage: any = null;
    browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        popupPage = await target.page();
        console.log('🔗 ポップアップウィンドウを検出しました');
      }
    });

    // ログイン完了を待機（複数の条件をチェック）
    const waitForLogin = async () => {
      const startTime = Date.now();
      const timeout = 300000; // 5分

      while (Date.now() - startTime < timeout) {
        try {
          // 方法1: URLの変化をチェック
          const currentUrl = page.url();
          if (currentUrl !== LOGIN_URL &&
              !currentUrl.includes('/login') &&
              !currentUrl.includes('/sign-in')) {
            console.log('✅ ログイン成功を検知しました（URLの変化）');
            return true;
          }

          // 方法2: Cookieの存在をチェック
          const cookies = await page.cookies();
          const hasClerkSession = cookies.some(c =>
            c.name === '__session' || c.name.includes('clerk')
          );
          if (hasClerkSession) {
            console.log('✅ ログイン成功を検知しました（セッションCookie）');
            return true;
          }

          // 1秒待機して再チェック
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          // ページが閉じられた場合などのエラーを無視
          console.log('⚠️  チェック中にエラー（無視）:', error.message);
        }
      }

      throw new Error('ログインタイムアウト');
    };

    await waitForLogin();

    // 少し待機してセッションが確立されるのを待つ
    console.log('⏳ セッション確立を待機中...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Cookieからトークンを取得
    let cookies = await page.cookies();

    // Cookieが少ない場合、もう一度待機して再取得
    if (cookies.length < 3) {
      console.log('⏳ Cookieが少ないため、さらに待機中...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      cookies = await page.cookies();
    }

    console.log(`\n📊 取得したCookie数: ${cookies.length}`);

    // Clerk関連のCookieを探す
    const clerkCookies = cookies.filter(cookie =>
      cookie.name.includes('clerk') ||
      cookie.name === '__session' ||
      cookie.name.includes('session')
    );

    console.log('\n🔍 検出されたClerk/セッション関連Cookie:');
    if (clerkCookies.length > 0) {
      clerkCookies.forEach(cookie => {
        const preview = cookie.value.length > 50
          ? `${cookie.value.substring(0, 50)}...`
          : cookie.value;
        console.log(`  - ${cookie.name}: ${preview}`);
      });
    } else {
      console.log('  ⚠️  Clerk関連のCookieが見つかりません');
    }

    // トークンを探す優先順位
    const tokenPriority = [
      '__session',
      '__clerk_db_jwt',
      'clerk_session',
      '__clerk_session',
    ];

    let sessionToken: string | undefined;
    for (const cookieName of tokenPriority) {
      const cookie = cookies.find(c => c.name === cookieName);
      if (cookie) {
        sessionToken = cookie.value;
        console.log(`\n✅ トークンを発見: ${cookieName}`);
        break;
      }
    }

    // 優先順位リストになかった場合、Clerk関連のCookieから探す
    if (!sessionToken && clerkCookies.length > 0) {
      sessionToken = clerkCookies[0].value;
      console.log(`\n✅ トークンを発見: ${clerkCookies[0].name}`);
    }

    if (!sessionToken) {
      console.error('\n❌ トークンが見つかりませんでした');
      console.log('\n📋 利用可能なすべてのCookie:');
      cookies.forEach(cookie => {
        console.log(`  - ${cookie.name} (${cookie.domain})`);
      });
      console.log('\n💡 ヒント:');
      console.log('  1. ログインが完了したか確認してください');
      console.log('  2. alphaXivのホームページにリダイレクトされたか確認してください');
      console.log('  3. もう一度 pnpm run get-token を実行してみてください');
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
