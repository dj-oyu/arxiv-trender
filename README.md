# arxiv-trender

論文トレンド取得・AI要約・メタデータ集約表示Webアプリ（Next.js/TypeScript）

## 概要

- alphaXivから論文トレンドを取得
- 論文本文のAI要約（Grok API対応、OpenAI API自動切り替えは未実装）
- Google認証によるAPIキー取得
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
```

### 各値の取得方法

- **Google Client ID**  
  1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)で新規OAuth 2.0クライアントIDを作成
  2. 「承認済みのJavaScript生成元」に `http://localhost:3000` を追加
  3. 「承認済みのリダイレクトURI」に `https://api.alphaxiv.org/v1/auth/login-google` を追加
     - alphaXivのGoogle認証APIがこのリダイレクトURIでトークンを受け取るため、これで問題ありません
  4. 発行されたクライアントIDを`NEXT_PUBLIC_GOOGLE_CLIENT_ID`に設定

- **OpenAI API Key**  
  [OpenAI Platform](https://platform.openai.com/account/api-keys)でAPIキーを発行し、`OPENAI_API_KEY`に設定。


- **Grok API Key**  
  Grok APIを利用する場合は、公式サイトでAPIキーを取得し、`GROK_API_KEY`に設定。

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
- Google認証・APIキー取得が必須
- エラー時のstderr出力は異常系テストの想定通り

---

## ライセンス

MIT
