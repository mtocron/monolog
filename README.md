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

Migration は TypeORM CLI で管理します。Phase 0 時点では、まだアプリケーション用の Migration はありません。

```bash
cd backend
npm run migration:run
npm run migration:revert
```
