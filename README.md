# monolog

個人用 Wiki アプリケーションです。開発環境は React + TypeScript + Vite、NestJS + TypeScript + TypeORM、PostgreSQL で構成しています。

## 開発環境の起動

1. `.env.example` を `.env` としてコピーします。
2. 以下を実行します。

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432

停止する場合は次を実行します。PostgreSQL のデータは `postgres_data` ボリュームに保持されます。

```bash
docker compose down
```

## ローカル起動

PostgreSQL を起動したうえで、別々のターミナルから実行します。

```bash
cd frontend
npm run dev
```

```bash
cd backend
npm run start:dev
```

## 確認コマンド

```bash
cd frontend
npm run build
npm run lint
npm run typecheck
```

```bash
cd backend
npm run build
npm run lint
npm run typecheck
npm run test
```

Migration は TypeORM CLI で管理します。初回起動後に、`app_settings` と設定変更履歴用の `app_settings_log` を作成します。

```bash
cd backend
npm run migration:run
npm run migration:revert
```

## Phase 1 API

- `GET /api/health`
- `GET /api/settings`
- `GET /api/settings/:key`
- `PUT /api/settings/:key`（`image.root_path` または `appearance.theme`）
