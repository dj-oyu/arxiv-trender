# 認証・リダイレクト仕様

## Google認証フロー

1. クライアントでGoogleログインボタンを押下
2. Google OAuth 2.0で認証し、IDトークンを取得
3. クライアントから `/api/auth` にIDトークンをPOST
4. サーバー側でalphaXiv APIの `/v1/auth/login-google` を呼び出し
5. alphaXivからAPIキーを取得し、クライアントに返却
6. クライアントは取得したAPIキーを状態管理で保持

---

## リダイレクト先

- 開発環境:  
  `http://localhost:3000`
- 本番環境:  
  `https://<your-production-domain>`

Google Cloud ConsoleのOAuthリダイレクトURIにも上記を登録すること。

---

## 必要な環境変数

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`（必須）
  Google Cloud Consoleで取得
- `ALPHAXIV_API_TOKEN`（任意）
  alphaXiv APIトークン。事前設定は不要で、Google認証でログインすることで取得できます。

---

## APIエンドポイント

### クライアント → サーバー
- `POST /api/auth`
  - Body: `{ "googleToken": "<Google IDトークン>" }`
  - レスポンス: `{ "success": true, "apiKey": "..." }`

### サーバー → alphaXiv API
- `POST https://api.alphaxiv.org/v1/auth/login-google`
  - Body: `{ "token": "<Google IDトークン>" }`
  - レスポンス: `{ "success": true, "apiKey": "..." }`

---

## 注意事項

- alphaXiv APIはトークンなしでも動作しますが、制限がかかる場合があります
- Google認証でログインすることで、APIキーを取得して使用することを推奨します
- クライアントから直接alphaXiv APIを呼び出さず、必ず `/api/auth` を経由します
  - これによりCORS問題を回避し、エラーハンドリングを統一できます
- Google認証後、APIキーはクライアントの状態管理で保持されます
- APIキーはリクエストごとに`/api/papers`等で利用されます
- セキュリティのため、APIキーは.env.localやサーバーサイドで管理することを推奨します
