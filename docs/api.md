# API仕様書

## 概要

本アプリのAPIはNext.jsのAPI Routesで実装されており、主に以下のエンドポイントを提供します。

- `/api/papers` : トレンド論文リスト取得
- `/api/summary` : 論文本文のAI要約生成
- `/api/auth` : Google認証→alphaXiv APIキー取得

---

## エンドポイント詳細

### GET `/api/papers?category=xxx&token=yyy`

- 概要: alphaXivからトレンド論文を取得
- パラメータ:
  - `category` (string, 必須): 例 `"agents"`
  - `token` (string, 必須): alphaXiv APIキー
- レスポンス例:
```json
{
  "success": true,
  "data": [
    {
      "universal_paper_id": "2504.11536",
      "title": "ReTool: Reinforcement Learning for Strategic Tool Use in LLMs",
      "abstract": "...",
      "authors": ["..."],
      "categories": ["Computer Science"],
      "metrics": { "comments_count": 0 },
      "publication_date": "2025-04-15T18:10:22.000Z"
    }
  ]
}
```

### POST `/api/summary`

- 概要: 指定論文のPDF本文を抽出し、AI要約を生成
- リクエストBody:
```json
{ "paperId": "2504.11536" }
```
- レスポンス: テキストストリーム（AI要約）

### POST `/api/auth`

- 概要: Google認証トークンをalphaXivに送信し、APIキーを取得
- リクエストBody:
```json
{ "googleToken": "..." }
```
- レスポンス例:
```json
{ "success": true, "apiKey": "..." }
```

---

## エラー仕様

- 400: パラメータ不足
- 401: 認証失敗
- 500: 外部APIエラー/AI要約失敗

---

## JSON Schema例

`/api/papers`の論文データ例: [docs/schema/paper.json](./schema/paper.json)

---

## 認証・リダイレクト仕様

- Google認証後、`/api/auth`でAPIキーを取得し、クライアントに保存
- alphaXivの認証リダイレクト先:  
  `http://localhost:3000`（開発環境）  
  本番は環境変数で切り替え

---

## alphaXiv API仕様（要点まとめ）

- ベースURL: `https://api.alphaxiv.org/v1/`
- 認証: Google認証トークンを`/v1/auth/login-google`にPOSTし、APIキーを取得
- トレンド論文取得:  
  `GET /v1/papers/trending?category=xxx&token=yyy`
- レスポンス例やパラメータは本ファイル上部のエンドポイント詳細を参照

- OpenAI API: [https://platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)
