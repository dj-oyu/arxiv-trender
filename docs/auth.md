# 認証・リダイレクト仕様

## Google認証フロー

1. クライアントでGoogleログインボタンを押下
2. Google OAuth 2.0で認証
3. 取得したIDトークンを `/api/auth` にPOST
4. サーバー側でalphaXivの `/v1/auth/login-google` にリダイレクト
5. alphaXivからAPIキーを取得し、クライアントに返却

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

## alphaXiv API認証エンドポイント

- `POST https://api.alphaxiv.org/v1/auth/login-google`
  - Body: `{ "idToken": "<Google IDトークン>" }`
  - レスポンス: `{ "success": true, "apiKey": "..." }`

---

## 注意事項

- alphaXiv APIはトークンなしでも動作しますが、制限がかかる場合があります
- Google認証でログインすることで、APIキーを取得して使用することを推奨します
- Google認証後、APIキーはクライアントの状態管理で保持されます
- APIキーはリクエストごとに`/api/papers`等で利用されます
- セキュリティのため、APIキーは.env.localやサーバーサイドで管理することを推奨します
