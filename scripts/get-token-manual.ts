#!/usr/bin/env tsx
/**
 * alphaXivトークン手動取得ガイド
 *
 * Googleが自動化ブラウザをブロックする場合の代替手段として、
 * 手動でトークンを取得する方法を案内します。
 *
 * 使い方:
 *   pnpm run get-token:manual
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const ENV_FILE = path.join(process.cwd(), '.env.local');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

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
    envContent += `\n# alphaXiv APIトークン（手動取得）\n${tokenLine}\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent.trim() + '\n');
  console.log(`✅ トークンを ${ENV_FILE} に保存しました`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   alphaXiv トークン手動取得ガイド');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📝 手動でトークンを取得する手順:\n');

  console.log('1️⃣  通常のブラウザで https://www.alphaxiv.org にアクセス\n');

  console.log('2️⃣  右上の「Login」ボタンをクリックしてGoogleアカウントでログイン\n');

  console.log('3️⃣  ログイン後、F12キーを押して開発者ツールを開く\n');

  console.log('4️⃣  以下のいずれかの方法でトークンを取得:\n');

  console.log('   【方法A: Cookieタブから取得（推奨）】');
  console.log('   - 開発者ツールで「Application」タブ（または「アプリケーション」）を開く');
  console.log('   - 左側メニューから「Cookies」→「https://www.alphaxiv.org」を選択');
  console.log('   - 「__session」という名前のCookieを探す');
  console.log('   - その「Value」をコピー\n');

  console.log('   【方法B: Consoleで取得】');
  console.log('   - 開発者ツールで「Console」タブを開く');
  console.log('   - 以下のコードを貼り付けて実行:');
  console.log('     document.cookie.split("; ").find(c => c.startsWith("__session="))?.split("=")[1]');
  console.log('   - 表示された文字列をコピー（ダブルクォートは含めない）\n');

  console.log('5️⃣  コピーしたトークンを下記に貼り付けてEnterキーを押す\n');

  console.log('─────────────────────────────────────────────────────\n');

  const token = await question('トークンを貼り付けてください: ');

  if (!token || token.trim().length === 0) {
    console.log('\n❌ トークンが入力されませんでした');
    rl.close();
    process.exit(1);
  }

  const trimmedToken = token.trim();

  // 簡単なバリデーション
  if (trimmedToken.length < 50) {
    console.log('\n⚠️  トークンが短すぎるようです。正しいトークンか確認してください。');
    const confirm = await question('このまま保存しますか？ (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('\nキャンセルしました');
      rl.close();
      process.exit(0);
    }
  }

  updateEnvFile(trimmedToken);

  console.log('\n✨ トークン設定完了！\n');
  console.log('📌 次のステップ:');
  console.log('  1. pnpm run check-token でトークン情報を確認');
  console.log('  2. pnpm run dev でアプリを起動\n');

  console.log('═══════════════════════════════════════════════════════\n');

  rl.close();
}

main().catch((error) => {
  console.error('エラーが発生しました:', error);
  rl.close();
  process.exit(1);
});
