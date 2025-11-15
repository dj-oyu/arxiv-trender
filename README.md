# arxiv-trender

論文トレンド取得・AI要約・メタデータ集約表示Webアプリ（Next.js/TypeScript）

## 概要

- alphaXiv v3 APIから論文トレンドを取得（認証不要）
- 論文本文のAI要約（Grok API対応、OpenAI API自動切り替えは未実装）
- メタデータ・要約・PDFリンクを集約表示

---

## 必要な環境変数（.env.local）

プロジェクトルートに`.env.local`を作成し、以下を記載してください。

```
# Google Cloud ConsoleでOAuthクライアントIDを取得
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

# OpenAI PlatformでAPIキーを取得
OPENAI_API_KEY=sk-...

# Grok APIを使う場合（任意）
GROK_API_KEY=...

# alphaXiv APIトークン（不要）
# ※ v3 APIは認証不要のため、設定する必要はありません
# ALPHAXIV_API_TOKEN=...
```

### 各値の取得方法

- **Google Client ID（現在未使用）**
  Google認証機能は実装されていますが、alphaXiv v3 APIが認証不要のため、現在は使用されていません。
  将来的に認証機能を追加する場合は、[Google Cloud Console](https://console.cloud.google.com/apis/credentials)で設定してください。

- **OpenAI API Key**
  [OpenAI Platform](https://platform.openai.com/account/api-keys)でAPIキーを発行し、`OPENAI_API_KEY`に設定。

- **Grok API Key**
  Grok APIを利用する場合は、公式サイトでAPIキーを取得し、`GROK_API_KEY`に設定。

- **alphaXiv API Token（不要）**
  alphaXiv v3 APIは認証が不要なため、設定する必要はありません。

---

## セットアップ・起動手順

1. **依存パッケージのインストール**
   ```
   pnpm install
   ```

2. **.env.localの作成・設定**
   - 上記の環境変数を記載

3. **開発サーバ起動**
   ```
   pnpm run dev
   ```
   - `http://localhost:3000` でアプリにアクセス

4. **テスト実行**
   ```
   pnpm run test
   ```
   - すべてのAPIルートの単体テストがパスすることを確認

---

## 開発・運用の注意

- `node_modules/`, `.env*`, `.next/` などは`.gitignore`済み
- テストはVitestで自動化
- alphaXiv v3 APIは認証不要で動作します
- エラー時のstderr出力は異常系テストの想定通り

---

## ライセンス

MIT
