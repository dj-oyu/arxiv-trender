# ファイル構造の概要: arxiv-trender ウェブアプリ

## 全体のファイル構造 (tree コマンド形式)
```
arxiv-trender
├── docs
│   ├── overview.md  # このファイル: プロジェクトのファイル構造の概要
│   └── reference
│       ├── alphaXivについて.md
│       ├── arxiv-api.md
│       └── grok-3-mini-api.md
├── src
│   ├── api
│   │   └── arxiv.ts  # arXiv API クライアント
│   ├── services
│   │   └── summarizer.ts  # AI 要約ロジック
│   ├── components
│   │   └── TrendsDisplay.tsx  # メタデータ表示 UI コンポーネント
│   └── tests
│       # テストファイル群 (例: arxiv.test.ts)
└── .clinerules  # Cline の計画と記録ファイル
```

## 開発対象となるソースファイル (glob 形式)
- src/api/*.ts: API 関連のファイル。
- src/services/*.ts: サービスロジックファイル。
- src/components/*.tsx: UI コンポーネントファイル。
- src/tests/*.ts: テストファイル。
