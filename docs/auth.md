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

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`  
  Google Cloud Consoleで取得
- `ALPHAXIV_API_TOKEN`  
  alphaXiv公式で取得

---

## alphaXiv API認証エンドポイント

- `POST https://api.alphaxiv.org/v1/auth/login-google`
  - Body: `{ "idToken": "<Google IDトークン>" }`
  - レスポンス: `{ "success": true, "apiKey": "..." }`

---

## 注意事項

- Google認証後、APIキーはクライアントの状態管理で保持
- APIキーはリクエストごとに`/api/papers`等で利用
- セキュリティのため、APIキーは.env.localやサーバーサイドで管理推奨
