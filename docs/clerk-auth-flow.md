# alphaXiv の現在の認証フロー（Clerk使用）

## 🔍 発見した情報

### Clerk設定
- **Clerk Publishable Key**: `pk_live_Y2xlcmsuYWxwaGF4aXYub3JnJA`
- **Clerk Domain**: `https://clerk.alphaxiv.org`
- **Clerk JS Version**: @clerk/clerk-js@5

### 確認事項
- ✅ alphaXivはClerk認証を使用
- ❌ `/v1/auth/login-google`エンドポイントは存在しない（404）
- ✅ WebSocketトークンはClerkが発行

## 📊 alphaXivの現在のログインフロー

```
┌─────────────┐
│   ユーザー   │
└──────┬──────┘
       │
       │ 1. https://www.alphaxiv.org/login にアクセス
       ▼
┌─────────────────────────────────┐
│   alphaXiv Webサイト             │
│   (Clerk UIコンポーネント表示)    │
└──────┬──────────────────────────┘
       │
       │ 2. "Sign in with Google" クリック
       ▼
┌─────────────────────────────────┐
│   Clerk認証サービス              │
│   (clerk.alphaxiv.org)           │
└──────┬──────────────────────────┘
       │
       │ 3. Google OAuthリダイレクト
       ▼
┌─────────────────────────────────┐
│   Google OAuth 2.0               │
└──────┬──────────────────────────┘
       │
       │ 4. ユーザーが承認
       ▼
┌─────────────────────────────────┐
│   Clerk認証サービス              │
│   - GoogleトークンをClerkトークンに変換  │
│   - セッションを作成              │
└──────┬──────────────────────────┘
       │
       │ 5. Clerkセッショントークン発行
       │    形式: JWT (issuer: clerk.alphaxiv.org)
       ▼
┌─────────────────────────────────┐
│   alphaXiv Webサイト             │
│   - Clerkトークンを保存           │
│   - APIリクエストに使用           │
└─────────────────────────────────┘
```

## 🔐 Clerkトークンの構造

実際のトークン例（デコード後）:
```json
{
  "iss": "https://clerk.alphaxiv.org",
  "sub": "user_2yEuAx2YSN2OJIjZS66ij7MOHr5",
  "email": "uyokumissile@gmail.com",
  "alphaixv_aud": ["app", "crx"],
  "azp": "https://www.alphaxiv.org",
  "exp": 1763220736,
  "iat": 1763220676,
  "sid": "sess_35WL2ryidT7Go5q6hQ1fU8fO2Gb",
  "sts": "active"
}
```

## 📝 alphaXiv API使用方法

### トークン取得方法

#### オプション1: 手動取得（現在推奨）
1. https://www.alphaxiv.org/ にアクセス
2. Googleアカウントでログイン（Clerk経由）
3. ブラウザの開発者ツールでトークンを取得
   - Application → Cookies → `__session` または `__clerk_db_jwt`
   - または Network タブでリクエストヘッダーを確認

#### オプション2: Clerk統合（将来の実装）
このプロジェクトにClerkを統合する場合：

1. `@clerk/nextjs`をインストール
```bash
pnpm add @clerk/nextjs
```

2. 環境変数を設定
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuYWxwaGF4aXYub3JnJA
```

3. ClerkProviderでアプリをラップ
```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}
```

**⚠️ 注意**: alphaXivのClerkインスタンスは`clerk.alphaxiv.org`でホストされています。
このPublishable Keyは**alphaXiv専用**であり、他のアプリケーションでは動作しない可能性があります。

## 🚧 現在のプロジェクトでの対応

### 即座の解決策

1. **トークンなしモード**（✅ 実装済み）
   - ALPHAXIV_API_TOKENなしで動作
   - 制限付きでAPI利用可能

2. **手動でAPIトークンを設定**
   ```bash
   # .env.local
   ALPHAXIV_API_TOKEN=your-clerk-token-here
   ```

### 将来の改善案

1. **Clerk完全統合**
   - ユーザーがalphaXivアカウントでログイン
   - Clerkトークンを自動取得・更新
   - しかし、alphaXivのClerk設定へのアクセスが必要

2. **独自の認証システム**
   - alphaXiv APIとは独立した認証
   - ユーザー管理を独自実装

## ❌ 動作しない認証フロー（削除対象）

```
現在の実装（動作しない）:
Google OAuth → Google IDトークン → /api/auth → /v1/auth/login-google (404)
                                                          ↓
                                                      存在しない
```

このフローは**alphaXivがClerkに移行する前の古い実装**と思われます。

## ✅ 推奨される対応

1. Google認証UIを削除または無効化
2. トークン手動設定を案内
3. ドキュメントを更新
