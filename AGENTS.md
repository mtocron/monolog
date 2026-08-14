# monolog Development Rules

このファイルは、`monolog` リポジトリ内でCodexが実装作業を行う際に常に従う開発ルールを定義する。

本プロジェクトの機能仕様・データ仕様・画面仕様については `docs/SPEC.md` をSource of Truthとする。

---

# 1. Specification

- 実装開始前に必ず `docs/SPEC.md` を確認する。
- `docs/SPEC.md` を本プロジェクトの正式な仕様として扱う。
- 指定されたPhaseのみ実装する。
- 後続Phaseの機能を先行実装しない。
- SPECに存在しない機能を勝手に追加しない。
- SPECに存在しない大きな設計変更を行わない。
- 実装中に仕様上の問題や矛盾を発見した場合は、独断で仕様を変更しない。
- 仕様変更が必要な場合は、変更理由と変更案をユーザーへ報告する。
- 「将来必要になるかもしれない」という理由だけで機能を追加しない。
- 過度な抽象化や過度な汎用化を避ける。
- シンプルで保守しやすい実装を優先する。

---

# 2. Project Goal

`monolog` は、自分自身の記録を蓄積し、あとから検索・閲覧・関連付けして振り返るための個人用Wikiである。

主な記録対象は以下。

- つぶやき
- 日記
- ジャーナリング
- 写真
- 感情
- 天気
- 場所
- 購入した商品
- 利用したサービス
- お金を使ったもの
- 購入後の感想

実装時は機能数よりも以下を優先する。

1. 記録しやすいこと
2. データを失わないこと
3. あとから情報を辿りやすいこと
4. PCとスマートフォンで使いやすいこと
5. 保守しやすいこと
6. Raspberry Piへ移行しやすいこと

---

# 3. Technology Stack

## Frontend

- React
- TypeScript
- Vite

## Backend

- NestJS
- TypeScript
- TypeORM

## Database

- PostgreSQL

## Infrastructure

- Docker
- Docker Compose

技術スタックを独断で変更しない。

新しい主要ライブラリ、UIフレームワーク、状態管理ライブラリ等を導入する場合は、既存構成で代替できないか確認する。

必要性がある場合は、導入理由を明確にする。

---

# 4. Repository Structure

基本構成は以下とする。

```text
monolog/
├── AGENTS.md
├── docs/
│   └── SPEC.md
├── frontend/
├── backend/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

既存構成を理由なく大きく変更しない。

---

# 5. Implementation Scope

ユーザーからPhaseを指定された場合、そのPhaseのみを実装する。

例：

```text
今回はPhase 2のみ
```

と指定された場合、

- Phase 2は実装してよい
- Phase 3以降は実装しない
- Phase 0〜1に問題がある場合は修正の必要性を報告する

後続Phaseで必要になるコードを先回りして作らない。

ただし、現在Phaseの実装に必要な最低限の共通処理は作成してよい。

---

# 6. Before Implementation

実装開始前に現在のリポジトリを確認する。

最低限以下を確認する。

- 現在のディレクトリ構成
- 既存コード
- package.json
- TypeScript設定
- Lint設定
- Format設定
- Docker設定
- Migration
- 完了済みPhase
- SPEC.mdのTodo状態

既存実装を確認せず、ゼロから作り直さない。

---

# 7. ID Policy

## Normal Tables

すべての通常テーブルは独立した `id` を持つ。

IDはULIDとする。

PostgreSQLでは原則、

```sql
varchar(26)
```

を使用する。

例：

```text
01K2ABCDEFGHJKLMNPQRSTUVWX
```

ULIDはBackend側で生成する。

ULID生成ロジックは共通化する。

EntityやServiceごとに異なるULID生成ロジックを書かない。

---

# 8. Junction Table Policy

中間テーブルにも独立したULIDの `id` を持たせる。

例：

```text
entry_tags
entry_purchases
```

構造例：

```text
id
entry_id
tag_id
created_at
updated_at
```

関連IDの組み合わせにはUnique Constraintを設定する。

例：

```sql
UNIQUE (entry_id, tag_id)
```

```sql
UNIQUE (entry_id, purchase_id)
```

複合Primary Keyは原則使用しない。

---

# 9. Database Naming

PostgreSQLのテーブル名・カラム名は原則として `snake_case` を使用する。

例：

```text
purchase_categories
purchase_category_id
recorded_at
created_at
updated_at
```

TypeScript側では通常のcamelCaseを使用してよい。

例：

```text
purchaseCategoryId
recordedAt
createdAt
updatedAt
```

TypeORMでDB側とのマッピングを明確にする。

---

# 10. Database Migration

DB変更は必ずTypeORM Migrationで管理する。

以下を手作業前提にしない。

- CREATE TABLE
- ALTER TABLE
- CREATE INDEX
- CREATE TRIGGER
- CREATE FUNCTION
- Seedに必要なDB変更

本番環境やRaspberry Pi上で手動SQLを実行しないと動かない設計にしない。

Migrationは `up` と `down` の両方を適切に実装する。

---

# 11. Log Table Policy

すべての通常テーブルに対応するログテーブルを作成する。

例：

```text
entries
entries_log

entry_tags
entry_tags_log

app_settings
app_settings_log
```

新しい通常テーブルを追加する場合は、原則として同時にログテーブルも追加する。

---

# 12. Log Table Primary Key

ログテーブルのPrimary KeyにはULIDを使用しない。

以下を基本とする。

```sql
id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

ログIDはPostgreSQL側で自動採番する。

BackendからログIDを指定しない。

---

# 13. Log source_id

通常テーブルのULIDはログテーブルの `source_id` として保存する。

例：

```text
entries.id
01K2ABCDEFGHJKLMNPQRSTUVWX
```

ログ：

```text
entries_log.id
123

entries_log.source_id
01K2ABCDEFGHJKLMNPQRSTUVWX
```

中間テーブルについても独立したULIDが存在するため、そのIDを `source_id` として保存する。

---

# 14. Log Trigger

ログはBackendから直接INSERTしない。

PostgreSQL Triggerによって自動作成する。

対象操作：

```text
INSERT
UPDATE
```

基本：

```sql
AFTER INSERT OR UPDATE
```

Trigger Functionでは変更後の `NEW` の値を保存する。

---

# 15. Log Snapshot

ログには変更された列だけではなく、変更後のレコード全体を保存する。

例：

```text
INSERT
content = ABC

UPDATE
content = DEF

UPDATE
content = GHI
```

ログ：

```text
INSERT ABC
UPDATE DEF
UPDATE GHI
```

過去ログをUPDATEしない。

ログは追記型とする。

---

# 16. Log Common Columns

ログテーブルには最低限以下を持たせる。

```text
id
source_id
operation
logged_at
```

`operation`：

```text
INSERT
UPDATE
```

`logged_at`：

```text
timestamptz
```

DB側で現在日時を設定する。

---

# 17. Log Foreign Key

ログテーブルから通常テーブルへのForeign Keyは設定しない。

例：

```text
entries_log.source_id
```

から、

```text
entries.id
```

へのFKは作成しない。

元データが削除された後もログを保持できる設計とする。

---

# 18. Log Index

ログ履歴取得を考慮し、

```text
source_id
id
```

のIndexを基本とする。

例：

```sql
CREATE INDEX idx_entries_log_source_id_id
ON entries_log(source_id, id);
```

必要以上のIndexは作成しない。

---

# 19. Log Trigger Naming

Trigger Function：

```text
fn_<table_name>_log
```

例：

```text
fn_entries_log
fn_app_settings_log
```

Trigger：

```text
trg_<table_name>_log
```

例：

```text
trg_entries_log
trg_app_settings_log
```

---

# 20. Database Change and Log Change

通常テーブルへカラムを追加・削除・変更した場合、必ず以下への影響を確認する。

- 対応ログテーブル
- Trigger Function
- Migration
- Test

例：

```text
entriesへcolumn追加
↓
entries_logへもcolumn追加
↓
fn_entries_log更新
```

通常テーブルだけ変更してログが古い構造のままにならないようにする。

---

# 21. DELETE Logging

Version 0.1ではDELETEをログ対象としない。

対象は、

```text
INSERT
UPDATE
```

のみ。

明示的な仕様変更がない限りDELETE Triggerを追加しない。

---

# 22. Application Settings Policy

アプリケーション設定値は原則としてDBに保存する。

設定テーブル：

```text
app_settings
```

DBへ接続する前に必要な情報だけ環境変数で保持する。

---

# 23. Environment Variables

環境変数で保持するものは最低限にする。

例：

```env
DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=

BACKEND_PORT=
```

必要に応じて、

```env
NODE_ENV=
```

等は使用してよい。

設定値を安易に環境変数へ追加しない。

---

# 24. DB Settings

現在の主要設定：

```text
image.root_path
appearance.theme
```

画像ルートは環境変数ではなくDB設定として管理する。

テーマ選択もDB設定として管理する。

---

# 25. app_settings

基本構造：

```text
id
key
value
description
created_at
updated_at
```

`id` はULID。

`key` はUnique。

例：

```text
image.root_path
appearance.theme
```

`app_settings` も通常テーブルであるため、対応する、

```text
app_settings_log
```

を作成する。

INSERT / UPDATE Triggerも設定する。

---

# 26. Settings Access

設定値取得処理はBackendで共通化する。

各Serviceから直接 `app_settings` を問い合わせる処理を重複して書かない。

例：

```text
SettingsService
```

等を経由する。

設定のキャッシュは必要であれば実装してよいが、過度に複雑な仕組みにしない。

---

# 27. Image Storage

画像本体はPostgreSQLへ保存しない。

ファイルシステムへ保存する。

ルートパス：

```text
app_settings
key = image.root_path
```

から取得する。

DBにはルートからの相対パスのみ保存する。

例：

```text
entries/2026/08/14/01K2ABCDEFGHJKLMNPQRSTUVWX.jpg
```

絶対パスはDBへ保存しない。

---

# 28. Image Filename

アップロード元のファイル名を実ファイル名として使用しない。

ULID等を使用して一意なファイル名を生成する。

元ファイル名は別カラムとして保持する。

---

# 29. File Path

ファイルパス処理でWindows固有・Linux固有の区切り文字をハードコードしない。

Node.js標準のpath処理等を利用する。

Windows開発環境とRaspberry Pi/Linux環境の両方で動作することを意識する。

---

# 30. Image Validation

Version 0.1で対応する画像：

- JPEG
- PNG
- WebP

Backend側で最低限以下をValidationする。

- MIME Type
- 拡張子
- ファイルサイズ

FrontendのValidationだけに依存しない。

---

# 31. Frontend Architecture

FrontendはReact + TypeScript + Viteを使用する。

Componentへ過度に処理を集中させない。

API通信処理を複数Componentへコピーしない。

必要に応じて、

- API Client
- Hooks
- Utility
- Feature単位のComponent

へ分離する。

ただし小規模な処理を必要以上に抽象化しない。

---

# 32. Frontend TypeScript

TypeScriptの型を適切に定義する。

`any` の使用は極力避ける。

Backend APIのResponse / Requestについても型を明確にする。

型エラーを無視するためだけの、

```text
as any
@ts-ignore
```

等を安易に使用しない。

---

# 33. Responsive UI

以下を対象とする。

- PC
- Smartphone
- Tablet

特に以下の機能はスマートフォンから使いやすくする。

- Timeline
- Entry登録
- Purchase登録
- 画像アップロード
- 詳細閲覧
- Settings
- Theme変更

Hoverだけで操作できるUIを作らない。

---

# 34. Theme Policy

Version 0.1では以下の3テーマを実装する。

```text
light
dark
capture
```

選択テーマ：

```text
app_settings
key = appearance.theme
```

へ保存する。

ページを再読み込みしてもテーマを維持する。

---

# 35. Theme Semantic Tokens

色はSemantic Tokenとして管理する。

ComponentへColor Hexを無秩序にハードコードしない。

CSS Custom Properties等を利用する。

例：

```css
--color-background
--color-surface
--color-heading
--color-text-primary
--color-text-secondary
--color-primary
--color-primary-text
--color-border
--color-focus
```

Componentは可能な限りSemantic Tokenを参照する。

---

# 36. Capture Theme

CaptureテーマではSPEC.mdに定義されたPaletteを使用する。

主要色：

```text
Background
#FFFFFF

Headline
#1F1235

Sub headline
#1B1425

Button
#FF6E6C

Button text
#1F1235

Stroke
#1F1235

Main
#FFFFFF

Highlight
#FF6E6C

Secondary
#67568C

Tertiary
#FBDD74
```

SPEC.mdの色定義をSource of Truthとする。

---

# 37. Backend Architecture

NestJSの責務を適切に分離する。

原則：

```text
Controller
↓
Service
↓
Repository / TypeORM
```

ControllerへDBアクセスや複雑なビジネスロジックを書かない。

共通処理は適切にService等へ分離する。

---

# 38. Backend Validation

API入力値はBackendでも必ずValidationする。

NestJS DTO / Validation機構を利用する。

最低限確認する。

- Required
- 最大文字数
- ULID
- Date
- Number
- Price
- Emotion
- Weather
- Theme
- Setting
- File

不正な値は適切なHTTP Status Codeで返す。

---

# 39. Error Handling

エラーを握りつぶさない。

以下を避ける。

```typescript
try {
  ...
} catch {
}
```

必要なエラーはログへ出力する。

ユーザーへ表示するエラーと内部ログに残すエラーを適切に分ける。

内部情報やStack TraceをそのままFrontendへ返さない。

---

# 40. API

REST APIとして実装する。

Base Path：

```text
/api
```

SPEC.mdで定義されたAPI方針に従う。

勝手にGraphQL等へ変更しない。

---

# 41. Date and Time

日時は原則としてDBでは、

```text
timestamptz
```

を使用する。

Purchaseの購入日はSPECに従って `date` とする。

日時の表示ではFrontend側でローカル時刻として扱う。

日時比較・保存方法を機能ごとにバラバラにしない。

---

# 42. Docker

Docker / Docker Composeを使用する。

最終的には、

```bash
docker compose up -d
```

で起動可能にする。

PostgreSQLデータや画像データをコンテナ内部だけへ保存しない。

永続化を行う。

---

# 43. Raspberry Pi

最終運用先としてARM64のRaspberry Piを想定する。

依存パッケージやDocker Imageを追加する場合は、ARM64対応を阻害しないか確認する。

Windowsでしか動かない実装にしない。

---

# 44. Security Scope

Version 0.1では認証を実装しない。

利用範囲：

```text
Local PC
↓
Home LAN
```

インターネット公開を前提とした仕組みを勝手に追加しない。

ただし入力Validation等の基本的な安全対策は行う。

---

# 45. Data Safety

本プロジェクトでは個人的な記録を保存するため、データ消失を避けることを優先する。

以下を安易に実行するコードを書かない。

- DB全削除
- Table Drop
- Image Storage全削除
- Recursive Delete
- Migration履歴破壊

破壊的処理が必要な場合は、目的と影響範囲を明確にする。

---

# 46. Delete Processing

EntryやPurchaseの削除時は、関連データや画像の扱いをSPECに従う。

DBとファイルシステムは単一トランザクションにできないため、不整合の可能性を考慮する。

ただしVersion 0.1で過度に複雑な分散トランザクション機構を作らない。

失敗時にログを残し、原因を確認できるようにする。

---

# 47. Dependencies

新しい依存パッケージを追加する場合は以下を確認する。

- 本当に必要か
- 標準機能で代替できないか
- メンテナンスされているか
- TypeScriptとの相性
- ARM64で問題がないか
- ライセンス上問題がないか

依存パッケージを必要以上に増やさない。

---

# 48. Testing

可能な範囲でテストを追加する。

特に重要な処理：

- ULID
- Validation
- Settings
- Entry
- Purchase
- DB Trigger
- Log
- File処理

既存テストが存在する場合は、変更後に実行する。

テストを通すためだけに仕様を変更しない。

---

# 49. Required Checks Before Completion

実装完了前に可能な範囲で以下を実行する。

Frontend：

```text
build
lint
type check
test
```

Backend：

```text
build
lint
type check
test
```

DB変更がある場合：

```text
migration up
migration down
migration up
```

等でMigrationの整合性を確認する。

---

# 50. Required Log Verification

DB変更で通常テーブルまたはログ関連を追加・変更した場合は、最低限以下を確認する。

```text
INSERT
↓
ログが1件作成される
↓
operation = INSERT
```

次に、

```text
UPDATE
↓
ログが1件追加される
↓
operation = UPDATE
```

さらに再UPDATEして、

```text
INSERT
UPDATE
UPDATE
```

の3履歴が残ることを確認する。

過去ログが上書きされていないことを確認する。

---

# 51. app_settings Verification

Settings関連を変更した場合は最低限以下を確認する。

- 設定を取得できる
- 設定を変更できる
- app_settingsがUPDATEされる
- app_settings_logへUPDATE履歴が作成される
- 不正な設定値を拒否する

Themeの場合：

```text
light
dark
capture
```

以外を拒否する。

---

# 52. Image Root Verification

画像関連を実装した場合は、

```text
app_settings.image.root_path
```

の値を利用して保存していることを確認する。

コードへ固定パスを書かない。

画像テーブルには相対パスだけが保存されていることを確認する。

---

# 53. Theme Verification

FrontendのTheme関連を変更した場合、最低限以下で表示確認する。

- Light
- Dark
- Capture

さらに、

- PC
- Smartphone

で大きく表示が崩れていないことを確認する。

---

# 54. Documentation

実装によって起動方法、設定方法、環境変数、Migration手順等が変わった場合はREADMEを更新する。

READMEと実装が食い違わないようにする。

---

# 55. SPEC Todo Update

Phase完了後、対応する `docs/SPEC.md` のTodoを更新する。

```text
- [ ]
```

を、

```text
- [x]
```

へ変更する。

実際には完了していない項目を完了扱いにしない。

一部のみ完了の場合はチェックを付けず、完了していない理由を報告する。

---

# 56. Do Not Modify Specification Silently

Codexは以下を独断で変更しない。

- Technology Stack
- Database
- Table Designの基本方針
- ULID方針
- Junction Table ID方針
- Log Table方針
- Trigger方針
- Settings方針
- Theme方針
- Version 0.1 Scope
- Phase構成

変更が必要な場合は、実装前に報告する。

---

# 57. Do Not Implement Out-of-Scope Features

明示的な追加指示がない限り以下を実装しない。

- Authentication
- User Management
- Internet公開
- Markdown
- PWA
- Offline Mode
- GPS
- Map API
- Weather API
- AI
- Elasticsearch
- 自動Backup
- Custom Theme Editor
- DELETE Log
- Log閲覧画面
- Log History API
- グラフ
- 高度な分析

---

# 58. Do Not Rewrite Existing Code Unnecessarily

既存コードが仕様を満たしている場合、理由なく全面的に書き直さない。

現在Phaseに必要な最小限の変更を優先する。

リファクタリングを行う場合は、

- 現在Phaseに必要
- バグ修正に必要
- 明確に保守性を改善する

のいずれかであること。

---

# 59. Code Quality

以下を意識する。

- 名前から役割が分かる
- 関数を極端に長くしない
- 巨大Componentを避ける
- 巨大Serviceを避ける
- 重複ロジックを放置しない
- Magic Numberを必要以上に使わない
- コメントでコードの内容をそのまま説明しない
- 複雑な理由がある場合にコメントを書く

---

# 60. Implementation Report

Phase実装後は以下を報告する。

1. 実装した内容
2. 追加・変更した主要ファイル
3. DB / Migration変更内容
4. ログテーブル / Trigger変更内容
5. Settings関連変更内容
6. Theme関連変更内容
7. 実行した確認
8. 確認結果
9. 未解決事項
10. 次Phaseへ進める状態か

何も問題がなくても、確認した内容を簡潔に報告する。

---

# 61. If Specification Is Ambiguous

仕様が曖昧な場合は、以下の優先順位で判断する。

1. `docs/SPEC.md`
2. この `AGENTS.md`
3. データを失わないこと
4. 記録しやすいこと
5. シンプルで保守しやすいこと
6. PC / Smartphone双方で利用しやすいこと
7. Raspberry Piへ移行しやすいこと

それでも仕様に影響する判断が必要な場合は、勝手に決定せずユーザーへ確認する。

---

# 62. Standard Phase Workflow

各Phaseでは原則以下の順番で作業する。

```text
1. AGENTS.md確認
2. docs/SPEC.md確認
3. 現在のRepository確認
4. 既存Phaseの完了状況確認
5. 今回Phaseの実装内容整理
6. 実装
7. Build / Lint / Type Check / Test
8. 必要ならMigration確認
9. 必要ならTrigger / Log確認
10. SPEC Todo更新
11. 実装結果報告
```

---

# 63. Final Principle

`monolog` では、機能を多く作ることより、

**記録しやすいこと**

**データを失わないこと**

**あとから辿りやすいこと**

を優先する。

実装判断に迷った場合は、より複雑な実装ではなく、仕様を満たす最もシンプルで保守しやすい実装を選択する。