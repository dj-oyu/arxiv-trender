# 認証・リダイレクト仕様

## 重要な変更（2025年）

alphaXivは**v3 APIに移行し、認証が不要**になりました。
以下のGoogle認証フローは実装されていますが、**現在は使用されていません**。

## Google認証フロー（非推奨・未使用）

1. クライアントでGoogleログインボタンを押下
2. Google OAuth 2.0で認証し、IDトークンを取得
3. クライアントから `/api/auth` にIDトークンをPOST
4. サーバー側でalphaXiv APIの `/v1/auth/login-google` を呼び出し
5. alphaXivからAPIキーを取得し、クライアントに返却
6. クライアントは取得したAPIキーを状態管理で保持

**注意**: `/v1/auth/login-google` エンドポイントは現在404を返します。alphaXivはClerk認証に移行しましたが、v3 APIでは認証自体が不要です。

---

## リダイレクト先

- 開発環境:  
  `http://localhost:3000`
- 本番環境:  
  `https://<your-production-domain>`

Google Cloud ConsoleのOAuthリダイレクトURIにも上記を登録すること。

---

## 必要な環境変数

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`（未使用）
  Google Cloud Consoleで取得できますが、v3 APIでは不要です
- `ALPHAXIV_API_TOKEN`（不要）
  v3 APIは認証不要のため、設定する必要はありません

---

## APIエンドポイント

### 現在使用中のエンドポイント

- `GET https://api.alphaxiv.org/papers/v3/feed`
  - パラメータ: `pageNum`, `sort`, `pageSize`, `interval`, `topics` (JSON配列)
  - 認証不要
  - レスポンス: `{ "papers": [...] }`

### 非推奨のエンドポイント（未使用）

#### クライアント → サーバー
- `POST /api/auth`
  - Body: `{ "googleToken": "<Google IDトークン>" }`
  - レスポンス: `{ "success": true, "apiKey": "..." }`
  - **注意**: 実装されていますが、alphaXiv側のエンドポイントが廃止されたため機能しません

#### サーバー → alphaXiv API
- `POST https://api.alphaxiv.org/v1/auth/login-google`
  - **廃止済み**: 404を返します
  - alphaXivはClerk認証に移行しましたが、v3 APIでは認証自体が不要です

---

## 注意事項

- **alphaXiv v3 APIは認証不要**で動作します
- Google認証機能は実装されていますが、現在は使用されていません
- 論文データの取得は `/api/papers` を経由してサーバーサイドで処理されます
  - これによりCORS問題を回避し、エラーハンドリングを統一できます
- 将来的にalphaXivが認証機能を再導入した場合、既存のコードを再利用できます
