# monolog — 自分用Wiki Webアプリケーション仕様書

## 1. プロジェクト概要

`monolog` は、日々の出来事・考え・感情・購入したものなどを記録し、あとから検索・閲覧・関連付けして振り返るための個人用Webアプリケーションである。

単純な日記アプリや家計簿ではなく、

- つぶやき
- 日記
- ジャーナリング
- 写真
- 感情
- 天気
- 場所
- 購入したもの
- お金を使ったもの
- その後の感想

などを蓄積し、相互に辿れる **「自分用Wiki」** を目指す。

初期バージョンでは、大きく以下の2種類の情報を扱う。

### Entry

- つぶやき
- 日記
- ジャーナリング

### Purchase

- 購入した商品
- 利用したサービス
- その他、お金を使ったもの

EntryとPurchaseは相互に関連付け可能とする。

---

# 2. 開発方針

優先順位は以下とする。

1. 記録するまでの手軽さ
2. データを失わないこと
3. あとから記録を辿れること
4. スマートフォンで使いやすいこと
5. Raspberry Piへ容易に移行できること
6. 保守しやすいこと
7. 機能の多さ

過度な抽象化や、将来機能の先行実装は避ける。

「将来必要になるかもしれない」という理由だけで複雑な仕組みを追加しない。

---

# 3. システム構成

## 3.1 初期開発環境

最初は開発用PC上ですべて動作させる。

```text
Local PC
├── Frontend
├── Backend
├── PostgreSQL
└── Image Storage
```

同一PCのブラウザからアクセスする。

例：

```text
Frontend
http://localhost:5173

Backend
http://localhost:3000
```

---

## 3.2 最終運用環境

将来的にはRaspberry Piへ移行する。

```text
Raspberry Pi
├── Frontend
├── Backend
├── PostgreSQL
└── Image Storage
```

家庭内LANから以下の端末でアクセス可能にする。

- PC
- Smartphone
- Tablet

アクセス例：

```text
http://raspberrypi.local
```

または、

```text
http://192.168.x.x
```

Version 0.1ではインターネット公開を行わない。

---

# 4. 技術スタック

## 4.1 Frontend

- React
- TypeScript
- Vite

SPAとして構築する。

BackendとはREST APIで通信する。

PC / Smartphone / Tabletに対応したレスポンシブUIとする。

UIライブラリやCSSフレームワークについては現時点では固定しない。

導入する場合は、既存構成との整合性と採用理由を確認してから使用する。

---

## 4.2 Backend

- NestJS
- TypeScript
- TypeORM

REST APIを提供する。

---

## 4.3 Database

- PostgreSQL

DBスキーマ変更はTypeORM Migrationで管理する。

---

## 4.4 Infrastructure

- Docker
- Docker Compose

最終的には以下をDocker Composeで起動可能にする。

```text
Frontend
Backend
PostgreSQL
```

Raspberry PiのARM64環境で利用可能な構成とする。

---

# 5. リポジトリ構成

基本的に1リポジトリで管理する。

```text
monolog/
├── frontend/
├── backend/
├── docs/
│   └── SPEC.md
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

必要性がない限り複雑なmonorepo管理ツールは導入しない。

---

# 6. ID設計

## 6.1 通常テーブル

すべての通常テーブルに独立した `id` を持たせる。

IDには **ULID** を使用する。

```text
01K2ABCDEFGHJKLMNPQRSTUVWX
```

PostgreSQLでは以下を基本とする。

```text
varchar(26)
```

Primary Key：

```text
id varchar(26) PRIMARY KEY
```

ULIDはBackend側で生成する。

ULID生成処理は共通化し、各機能に個別実装しない。

---

## 6.2 中間テーブル

中間テーブルについても、独立したULIDの `id` を持たせる。

対象：

```text
entry_tags
entry_purchases
```

例えば：

```text
entry_tags

id        varchar(26) PK
entry_id  varchar(26) FK
tag_id    varchar(26) FK
```

`entry_id + tag_id` にはUnique Constraintを設定する。

```text
UNIQUE (entry_id, tag_id)
```

同様に、

```text
entry_purchases

id           varchar(26) PK
entry_id     varchar(26) FK
purchase_id  varchar(26) FK
created_at   timestamptz
```

には、

```text
UNIQUE (entry_id, purchase_id)
```

を設定する。

**複合Primary Keyは使用しない。**

---

# 7. ログテーブルのID

ログテーブルについてはULIDを使用しない。

すべてのログテーブルに、

```text
id bigint
```

を持たせる。

PostgreSQL側で自動採番する。

基本：

```sql
id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

ログIDはBackend側から指定しない。

---

# 8. 日時

日時は原則としてPostgreSQLの、

```text
timestamptz
```

を使用する。

Frontendではユーザーのローカル時刻として表示する。

Entryでは以下を区別する。

```text
recorded_at
created_at
updated_at
```

Purchaseの購入日は時刻不要のため、

```text
date
```

とする。

---

# 9. アプリケーション設定

## 9.1 基本方針

**アプリケーションの設定値は原則としてDBで管理する。**

環境変数は、DBへ接続するために必要な情報など、

**DBへアクセスする前に必要になる設定**

に限定する。

---

# 10. 環境変数として保持するもの

最低限以下を環境変数で管理する。

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

等を使用してよい。

`.env` はGit管理しない。

`.env.example` のみGit管理する。

---

# 11. DB設定テーブル

アプリケーション設定用に以下のテーブルを作成する。

```text
app_settings
```

構造：

```text
id          varchar(26) PK
key         varchar NOT NULL UNIQUE
value       text
description text
created_at  timestamptz NOT NULL
updated_at  timestamptz NOT NULL
```

設定値は原則として、

```text
key
value
```

形式で管理する。

---

# 12. app_settings 初期設定

初期状態では最低限以下を管理する。

```text
image.root_path
appearance.theme
```

例：

```text
key
image.root_path

value
C:/monolog/images
```

Raspberry Piでは例えば、

```text
/data/monolog/images
```

へ変更できるようにする。

テーマ：

```text
key
appearance.theme

value
light
```

---

# 13. 設定値のSource of Truth

`app_settings` に存在する設定については、

**DBの値をSource of Truthとする。**

BackendやFrontendへ同じ設定を重複してハードコードしない。

ただし、テーマの色定義など、プログラムそのもののデザイン定義はFrontendに保持してよい。

DBでは、

```text
light
dark
capture
```

のように「どのテーマを使用するか」を保存する。

---

# 14. 画像保存設定

画像保存先ルートは、

```text
app_settings
key = image.root_path
```

から取得する。

旧仕様の、

```env
IMAGE_ROOT_PATH=
```

は使用しない。

例：

Windows：

```text
C:/monolog/images
```

Raspberry Pi：

```text
/data/monolog/images
```

画像保存処理を行う際は設定Service等を経由して値を取得する。

各Serviceから直接 `app_settings` を問い合わせるコードを重複させない。

---

# 15. 設定キャッシュ

設定値を毎回DBから読み込む必要はない。

Backend側で適切にキャッシュしてよい。

ただし設定変更後は、新しい設定が反映される仕組みを用意する。

過度に複雑なキャッシュ機構は導入しない。

---

# 16. 設定画面

FrontendにSettings画面を作成する。

初期対象：

- 画像保存ルート
- カラーテーマ

例：

```text
Settings

ストレージ
  画像保存先
  C:/monolog/images

外観
  テーマ
  ○ Light
  ○ Dark
  ○ Capture
```

---

# 17. 画像保存仕様

画像ファイル本体はPostgreSQLへ保存しない。

ファイルシステムへ保存する。

DBには画像保存ルートからの **相対パス** を保存する。

例：

```text
entries/2026/08/14/01K2ABCDEFGHJKLMNPQRSTUVWX.jpg
```

実際の保存先：

```text
<image.root_path>/
└── entries/
    └── 2026/
        └── 08/
            └── 14/
                └── 01K2ABCDEFGHJKLMNPQRSTUVWX.jpg
```

DBへ絶対パスを保存しない。

---

# 18. 画像ファイル名

アップロード元のファイル名を、そのまま実ファイル名として使用しない。

ULID等を利用して一意なファイル名を生成する。

例：

```text
01K2ABCDEFGHJKLMNPQRSTUVWX.jpg
```

元ファイル名はDBへ別途保存する。

---

# 19. 対応画像形式

Version 0.1では以下に対応する。

- JPEG
- PNG
- WebP

複数画像アップロード可能とする。

Backendで以下を検証する。

- MIME Type
- 拡張子
- ファイルサイズ

任意のファイルを画像として保存できないようにする。

---

# 20. Entry

つぶやき・日記・ジャーナリングを別機能として分離しない。

すべて `Entry` とする。

ユーザーに、

```text
つぶやき
日記
ジャーナリング
```

の分類を必須選択させない。

短い文章でも長い文章でも同一のEntryとして保存する。

---

# 21. Entryデータ

```text
Entry
├── id
├── content
├── recordedAt
├── emotion
├── weather
├── location
├── createdAt
└── updatedAt
```

関連：

```text
Entry
├── Images
├── Tags
└── Purchases
```

---

# 22. Entry本文

`content`

本文。

プレーンテキストとして保存する。

改行を保持する。

Version 0.1ではMarkdownは使用しない。

本文のみでも保存可能とする。

---

# 23. Entry記録日時

`recordedAt`

実際に記録したい出来事の日時。

```text
recordedAt = 2026-08-13 22:00
createdAt  = 2026-08-14 09:00
```

Timelineは原則、

```text
recordedAt DESC
```

で表示する。

---

# 24. Entry画像

1つのEntryに0〜複数画像を登録可能とする。

画像には、

```text
sort_order
```

を持たせる。

---

# 25. Tag

Entryに0〜複数のTagを設定できる。

例：

```text
#仕事
#休日
#カフェ
#旅行
#読書
```

DBには `#` を含めず名称のみ保存する。

Tag名称はUniqueとする。

---

# 26. Emotion

Entryに0〜1個の感情を設定できる。

初期候補：

```text
happy
calm
sad
angry
anxious
tired
excited
```

Version 0.1ではEmotionマスタ編集機能を実装しない。

---

# 27. Weather

Entryに0〜1個の天気を設定できる。

初期候補：

```text
sunny
cloudy
rainy
snowy
sunny_cloudy
sunny_rainy
cloudy_rainy
```

Version 0.1では外部天気APIを使用しない。

---

# 28. Location

Entryに任意で場所を設定できる。

Version 0.1では単純な文字列とする。

例：

```text
自宅
松山
東京駅
○○カフェ
```

以下は実装しない。

- GPS
- 地図API
- Locationマスタ

---

# 29. Purchase

購入した商品、サービス、お金を使ったものを記録する。

家計簿として厳密な会計を行うことより、

**いつ・何を買い、その後どうだったか**

を振り返れることを重視する。

---

# 30. Purchaseデータ

```text
Purchase
├── id
├── name
├── purchaseCategoryId
├── purchasedAt
├── price
├── shop
├── description
├── createdAt
└── updatedAt
```

関連：

```text
Purchase
├── Images
└── Entries
```

---

# 31. Purchase Category

Purchaseにはカテゴリを1つ設定する。

初期候補：

```text
食事
日用品
家電
ガジェット
服
本
ゲーム
サブスク
交通
旅行
医療
その他
```

Categoryはマスタとして管理する。

---

# 32. 購入日

`purchasedAt`

DB型：

```text
date
```

---

# 33. 金額

`price`

日本円を前提とする。

```text
integer
0以上
負数禁止
```

0円は許可する。

---

# 34. Shop

`shop`

文字列として保存する。

例：

```text
Amazon
ヨドバシカメラ
コメダ珈琲
```

Version 0.1では店舗マスタを作成しない。

---

# 35. Purchase詳細

`description`

自由記述。

商品そのものについて保存しておきたい情報を入力する。

---

# 36. Purchase画像

1つのPurchaseに0〜複数画像を登録可能とする。

用途：

- 商品写真
- レシート
- スクリーンショット

---

# 37. EntryとPurchase

EntryとPurchaseは多対多。

```text
Entry
   │
   │ N
   │
EntryPurchase
   │
   │ N
   │
Purchase
```

中間テーブル：

```text
entry_purchases
```

は独立したULIDの `id` を持つ。

---

# 38. テーブル一覧

Version 0.1では以下を作成する。

```text
entries
entry_images
tags
entry_tags

purchase_categories
purchases
purchase_images
entry_purchases

app_settings
```

---

# 39. entries

```text
id                  varchar(26) PK
content             text NOT NULL
recorded_at         timestamptz NOT NULL
emotion             varchar NULL
weather             varchar NULL
location            varchar NULL
created_at          timestamptz NOT NULL
updated_at          timestamptz NOT NULL
```

---

# 40. entry_images

```text
id                  varchar(26) PK
entry_id            varchar(26) NOT NULL FK
file_path           text NOT NULL
original_file_name  text NOT NULL
sort_order          integer NOT NULL
created_at          timestamptz NOT NULL
```

---

# 41. tags

```text
id                  varchar(26) PK
name                varchar NOT NULL UNIQUE
created_at          timestamptz NOT NULL
updated_at          timestamptz NOT NULL
```

---

# 42. entry_tags

```text
id                  varchar(26) PK
entry_id            varchar(26) NOT NULL FK
tag_id              varchar(26) NOT NULL FK
created_at          timestamptz NOT NULL
updated_at          timestamptz NOT NULL

UNIQUE (entry_id, tag_id)
```

---

# 43. purchase_categories

```text
id                  varchar(26) PK
name                varchar NOT NULL UNIQUE
sort_order          integer NOT NULL
created_at          timestamptz NOT NULL
updated_at          timestamptz NOT NULL
```

---

# 44. purchases

```text
id                    varchar(26) PK
name                  varchar NOT NULL
purchase_category_id  varchar(26) NOT NULL FK
purchased_at          date NOT NULL
price                 integer NOT NULL
shop                  varchar NULL
description           text NULL
created_at            timestamptz NOT NULL
updated_at            timestamptz NOT NULL
```

---

# 45. purchase_images

```text
id                  varchar(26) PK
purchase_id         varchar(26) NOT NULL FK
file_path           text NOT NULL
original_file_name  text NOT NULL
sort_order          integer NOT NULL
created_at          timestamptz NOT NULL
```

---

# 46. entry_purchases

```text
id                  varchar(26) PK
entry_id            varchar(26) NOT NULL FK
purchase_id         varchar(26) NOT NULL FK
created_at          timestamptz NOT NULL
updated_at          timestamptz NOT NULL

UNIQUE (entry_id, purchase_id)
```

---

# 47. app_settings

```text
id                  varchar(26) PK
key                 varchar NOT NULL UNIQUE
value               text
description         text
created_at          timestamptz NOT NULL
updated_at          timestamptz NOT NULL
```

---

# 48. 全通常テーブル共通方針

原則として通常テーブルには、

```text
id
created_at
updated_at
```

を持たせる。

ただし、明確に更新されることがないデータについては `updated_at` を省略してもよいが、実装前に仕様上の理由を明確にする。

中間テーブルも通常テーブルとして扱う。

---

# 49. ログテーブル

すべての通常テーブルに対応するログテーブルを作成する。

```text
entries_log
entry_images_log
tags_log
entry_tags_log

purchase_categories_log
purchases_log
purchase_images_log
entry_purchases_log

app_settings_log
```

今後通常テーブルを追加した場合も、原則ログテーブルを追加する。

---

# 50. ログ対象操作

ログ対象：

```text
INSERT
UPDATE
```

PostgreSQL Triggerを使用する。

BackendのServiceからログINSERT処理を呼び出してはならない。

---

# 51. Trigger

各通常テーブルに、

```text
AFTER INSERT OR UPDATE
```

Triggerを設定する。

例：

```sql
CREATE TRIGGER trg_entries_log
AFTER INSERT OR UPDATE
ON entries
FOR EACH ROW
EXECUTE FUNCTION fn_entries_log();
```

Trigger Functionでは `NEW` の状態をログテーブルへ保存する。

---

# 52. ログ保存方式

変更後のレコード全体をスナップショットとして保存する。

例：

```text
entries

INSERT content = "ABC"
UPDATE content = "DEF"
UPDATE content = "GHI"
```

ログ：

```text
1 INSERT ABC
2 UPDATE DEF
3 UPDATE GHI
```

UPDATE時に変更された列だけを保存する方式にはしない。

---

# 53. ログテーブル共通仕様

すべてのログテーブルに以下を持たせる。

```text
id
source_id
operation
logged_at
```

`id`：

```text
bigint
GENERATED ALWAYS AS IDENTITY
PRIMARY KEY
```

`source_id`：

```text
varchar(26)
```

元テーブルのULIDを保持する。

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

# 54. 中間テーブルのログ

中間テーブルにも独立したULID IDが存在するため、他の通常テーブルと同じ構造でログを作成する。

例：

```text
entry_tags

id = 01K2AAA...
```

ログ：

```text
entry_tags_log

id        = 12345
source_id = 01K2AAA...
entry_id  = ...
tag_id    = ...
```

---

# 55. ログテーブルForeign Key

ログテーブルから通常テーブルへのForeign Keyは設定しない。

元データが削除された場合でも、ログを独立して保持できるようにする。

---

# 56. ログテーブルの変更禁止

Backendからログテーブルを直接、

- INSERT
- UPDATE
- DELETE

するAPIを作成しない。

通常のログ書き込み経路はTriggerのみとする。

---

# 57. ログIndex

履歴取得を考慮して、

```text
source_id
+
id
```

にIndexを設定する。

例：

```sql
CREATE INDEX idx_entries_log_source_id_id
ON entries_log(source_id, id);
```

履歴取得：

```sql
SELECT *
FROM entries_log
WHERE source_id = $1
ORDER BY id ASC;
```

---

# 58. Trigger命名規則

Trigger Function：

```text
fn_<table_name>_log
```

Trigger：

```text
trg_<table_name>_log
```

例：

```text
fn_entries_log
trg_entries_log

fn_app_settings_log
trg_app_settings_log
```

---

# 59. Migration

通常テーブル追加時は、同じMigrationまたは関連するMigrationで以下を管理する。

1. 通常テーブル
2. ログテーブル
3. ログIndex
4. Trigger Function
5. Trigger

通常テーブルへカラムを追加した場合は、

- ログテーブル
- Trigger Function

への影響も必ず確認する。

---

# 60. DELETEログ

Version 0.1では、

```text
INSERT
UPDATE
```

のみをログ対象とする。

DELETEログは現時点では実装しない。

---

# 61. カラーテーマ

Frontendは複数のカラーテーマを選択できるようにする。

Version 0.1では以下の3テーマを実装する。

```text
light
dark
capture
```

テーマ選択値は、

```text
app_settings

key = appearance.theme
```

へ保存する。

Frontendを再読み込みしても選択したテーマを維持する。

---

# 62. テーマ実装方針

コンポーネント内に直接カラーコードを大量に記述しない。

CSS Custom Properties等を使用してテーマを管理する。

例：

```css
:root {
  --color-background: ...;
  --color-surface: ...;
  --color-text-primary: ...;
  --color-text-secondary: ...;
  --color-primary: ...;
  --color-primary-text: ...;
  --color-border: ...;
}
```

React Componentは可能な限りSemantic Tokenを使用する。

---

# 63. Lightテーマ

一般的な明るいテーマ。

基本方針：

- 明るい背景
- 暗い文字色
- 十分なコントラスト
- 長時間の日記・Timeline閲覧でも読みやすいこと

具体的な細かな色はFrontend実装時に決定してよい。

---

# 64. Darkテーマ

暗い環境でも見やすいDarkテーマ。

基本方針：

- 暗い背景
- 明るい文字
- 真っ黒と真っ白だけに依存しない
- Entry本文を長時間読んでも目に負担がかかりにくい配色
- Primary Color等はLightテーマと意味的に対応させる

DarkテーマでUIレイアウトや情報量を変更しない。

色のみをテーマとして切り替える。

---

# 65. Captureテーマ

ユーザー指定のキャプチャを元にしたテーマを実装する。

テーマID：

```text
capture
```

キャプチャで指定されている基本色を以下とする。

## Elements

Background：

```text
#FFFFFF
```

Headline：

```text
#1F1235
```

Sub headline：

```text
#1B1425
```

Button：

```text
#FF6E6C
```

Button text：

```text
#1F1235
```

## Illustration

Stroke：

```text
#1F1235
```

Main：

```text
#FFFFFF
```

Highlight：

```text
#FF6E6C
```

Secondary：

```text
#67568C
```

Tertiary：

```text
#FBDD74
```

色コードは大文字・小文字の違いを意味的な差として扱わない。

---

# 66. Captureテーマ Semantic Token

Captureテーマでは少なくとも以下をベースにする。

```css
[data-theme="capture"] {
  --color-background: #FFFFFF;

  --color-heading: #1F1235;
  --color-text-primary: #1F1235;
  --color-text-secondary: #1B1425;

  --color-primary: #FF6E6C;
  --color-primary-text: #1F1235;

  --color-illustration-stroke: #1F1235;
  --color-illustration-main: #FFFFFF;
  --color-illustration-highlight: #FF6E6C;
  --color-illustration-secondary: #67568C;
  --color-illustration-tertiary: #FBDD74;
}
```

必要なSurface / Border / Hover / Focus等については、この配色との整合性を保ちながら追加してよい。

---

# 67. テーマ選択UI

Settings画面にテーマ選択を設ける。

例：

```text
外観

テーマ

○ Light
○ Dark
● Capture
```

可能であれば各テーマの簡単なプレビューを表示する。

テーマ変更時は、ページ全体を再読み込みしなくても見た目が切り替わることが望ましい。

保存に成功したテーマをDBへ反映する。

---

# 68. Theme API

設定API経由でテーマを取得・変更する。

例：

```text
GET /api/settings
```

または、

```text
GET /api/settings/appearance.theme
```

更新：

```text
PUT /api/settings/appearance.theme
```

具体的なREST設計は統一性を考慮して決定する。

Version 0.1では少なくとも、

- 設定一覧または必要設定取得
- 設定更新

ができること。

---

# 69. Settings API

最低限以下の設定を扱う。

```text
image.root_path
appearance.theme
```

Backendでは設定値ごとにValidationする。

例えば、

```text
appearance.theme
```

では、

```text
light
dark
capture
```

以外を許可しない。

---

# 70. Timeline

トップページ。

Entryを、

```text
recorded_at DESC
```

で表示する。

同一日時の場合は、

```text
created_at
id
```

等で安定した順序を設定する。

---

# 71. Entry登録UI

本文を中心としたシンプルなUIとする。

```text
┌──────────────────────────┐
│ 今なにしてる？            │
│                          │
│                          │
└──────────────────────────┘

[画像] [タグ] [感情] [天気] [場所] [購入記録]

                       [保存]
```

初期状態ですべてのオプション入力欄を展開しない。

本文のみで素早く保存できること。

---

# 72. Entry詳細

以下を表示する。

- 本文
- 画像
- 記録日時
- タグ
- 感情
- 天気
- 場所
- 関連Purchase

編集・削除操作を提供する。

---

# 73. Purchase一覧

購入日の新しい順に表示する。

例：

```text
2026/08/14

Sony ワイヤレスイヤホン
¥24,800
Amazon
ガジェット

----------------------------

コメダ モーニング
¥680
コメダ珈琲
食事
```

---

# 74. Purchase詳細

以下を表示する。

- 商品・サービス名
- Category
- 購入日
- 金額
- Shop
- 画像
- 詳細
- 関連Entry

---

# 75. REST API

Base Path：

```text
/api
```

## Entry

```text
GET    /api/entries
GET    /api/entries/:id
POST   /api/entries
PUT    /api/entries/:id
DELETE /api/entries/:id
```

## Entry Image

```text
POST   /api/entries/:id/images
DELETE /api/entries/:id/images/:imageId
```

## Tag

```text
GET    /api/tags
POST   /api/tags
```

## Purchase

```text
GET    /api/purchases
GET    /api/purchases/:id
POST   /api/purchases
PUT    /api/purchases/:id
DELETE /api/purchases/:id
```

## Purchase Image

```text
POST   /api/purchases/:id/images
DELETE /api/purchases/:id/images/:imageId
```

## Category

```text
GET /api/purchase-categories
```

## Settings

```text
GET /api/settings
```

設定更新APIも提供する。

---

# 76. レスポンシブ対応

対象：

- PC
- Smartphone
- Tablet

特にスマートフォンでは、

- Timeline
- Entry登録
- Purchase登録
- 写真選択
- 詳細表示
- Settings
- Theme変更

を快適に操作できること。

Hover操作だけに依存しない。

---

# 77. Validation

FrontendだけでなくBackendでも入力値をValidationする。

NestJS DTO等を利用する。

最低限：

- 必須値
- 最大文字数
- ULID
- 日付
- 金額
- Emotion
- Weather
- Theme
- Setting値
- 画像形式
- 画像サイズ

を確認する。

---

# 78. Docker

最終的に以下で起動可能にする。

```bash
docker compose up -d
```

構成：

```text
services:
  frontend
  backend
  postgres
```

PostgreSQLおよび画像は永続化する。

例：

```text
/data/monolog/
├── postgres/
└── images/
```

コンテナ再作成でデータを失わないこと。

---

# 79. Raspberry Pi

ARM64 Linux環境で動作することを考慮する。

Raspberry Pi再起動後にDocker Containerが自動復旧できる構成を目指す。

家庭内LANのPC・スマートフォンからアクセス可能にする。

---

# 80. 認証

Version 0.1では認証を実装しない。

用途：

```text
初期
Local PC only

将来
Home LAN only
```

インターネット公開は対象外。

---

# 81. バックアップ

以下をセットでバックアップする。

```text
PostgreSQL
+
Image Storage
```

PostgreSQLには、

- 通常データ
- ログ
- app_settings

も含まれる。

Version 0.1完成時までにREADMEへ、

- PostgreSQL Backup
- PostgreSQL Restore
- Image Backup
- Image Restore
- Raspberry Pi故障時の復旧

を記載する。

---

# 82. Phase 0 — プロジェクト準備

- [x] Gitリポジトリ構成
- [x] React + TypeScript + Vite作成
- [x] NestJS + TypeScript作成
- [x] TypeORM導入
- [x] PostgreSQL開発環境
- [x] Docker Compose
- [x] `.env.example`
- [x] `.gitignore`
- [x] README
- [x] Formatter
- [x] Linter
- [x] Migration環境
- [x] Frontend起動
- [x] Backend起動
- [x] PostgreSQL接続

---

# 83. Phase 1 — Backend共通基盤 / Settings

- [x] 環境変数読み込み
- [x] PostgreSQL接続
- [x] TypeORM設定
- [x] Migration環境
- [x] ULID生成共通処理
- [x] ULID Validation
- [x] DTO Validation
- [x] Error Handling
- [x] CORS
- [x] Logging
- [x] Health Check API
- [x] `app_settings` 作成
- [x] `app_settings_log` 作成
- [x] Settings Trigger Function
- [x] Settings INSERT Trigger
- [x] Settings UPDATE Trigger
- [x] Settings Service
- [x] Settings API
- [x] `image.root_path` 初期設定
- [x] `appearance.theme` 初期設定

---

# 84. Phase 2 — Entry DB

## 通常テーブル

- [x] `entries`
- [x] `entry_images`
- [x] `tags`
- [x] `entry_tags`
- [x] `entry_tags.id` ULID対応
- [x] `entry_tags(entry_id, tag_id)` Unique
- [x] Entity
- [x] Relation

## ログ

- [x] `entries_log`
- [x] `entry_images_log`
- [x] `tags_log`
- [x] `entry_tags_log`
- [x] bigint Identity PK
- [x] source_id
- [x] Trigger Function
- [x] INSERT Trigger
- [x] UPDATE Trigger
- [x] Index
- [x] INSERTログ確認
- [x] UPDATEログ確認

## Migration

- [x] up確認
- [x] down確認

---

# 85. Phase 3 — Entry API

- [x] Entry一覧
- [x] Entry詳細
- [x] Entry登録
- [x] Entry更新
- [x] Entry削除
- [x] recordedAt
- [x] emotion
- [x] weather
- [x] location
- [x] Tag一覧
- [x] Tag登録
- [x] Tag関連付け
- [x] Tag関連解除
- [x] Validation
- [x] Error Handling
- [x] Triggerログ確認

---

# 86. Phase 4 — Entry画像

- [x] multipart/form-data
- [x] 複数画像
- [x] JPEG
- [x] PNG
- [x] WebP
- [x] ファイルサイズValidation
- [x] 保存ファイル名生成
- [x] `image.root_path` をDBから取得
- [x] 相対パス保存
- [x] 元ファイル名保存
- [x] sortOrder
- [x] 画像取得
- [x] 画像削除
- [x] Entry削除時画像処理
- [x] 不整合対策
- [x] ログ確認

---

# 87. Phase 5 — Frontend Entry

- [x] 共通レイアウト
- [x] API Client
- [x] Timeline
- [x] Entry Card
- [x] Entry登録
- [x] Entry詳細
- [x] Entry編集
- [x] Entry削除
- [x] recordedAt
- [x] Tag
- [x] Emotion
- [x] Weather
- [x] Location
- [x] 複数画像
- [x] Preview
- [x] Loading
- [x] Error
- [x] 削除確認

---

# 88. Phase 6 — Theme / Settings UI

- [x] Settings画面
- [x] image.root_path表示
- [x] image.root_path変更
- [x] Theme選択
- [x] Lightテーマ
- [x] Darkテーマ
- [x] Captureテーマ
- [x] Capture Palette実装
- [x] CSS Semantic Token化
- [x] Theme即時反映
- [x] Theme DB保存
- [x] 再読み込み後Theme復元
- [ ] PC表示確認
- [ ] Smartphone表示確認

---

# 89. Phase 7 — レスポンシブ対応

- [x] PC
- [x] Smartphone
- [x] Tablet
- [x] Entry入力
- [x] 画像選択
- [x] タップ操作
- [x] 長文
- [x] Settings
- [x] Theme
- [ ] モバイルブラウザ確認

---

# 90. Phase 8 — Purchase DB / API

## 通常テーブル

- [x] `purchase_categories`
- [x] `purchases`
- [x] `purchase_images`
- [x] Entity
- [x] Relation
- [x] 初期Category

## ログ

- [x] `purchase_categories_log`
- [x] `purchases_log`
- [x] `purchase_images_log`
- [x] bigint Identity PK
- [x] source_id
- [x] Trigger Function
- [x] INSERT Trigger
- [x] UPDATE Trigger
- [x] Index
- [x] ログ確認

## API

- [x] Purchase一覧
- [x] Purchase詳細
- [x] Purchase登録
- [x] Purchase更新
- [x] Purchase削除
- [x] Category一覧
- [x] Purchase画像
- [x] Triggerログ確認

---

# 91. Phase 9 — Purchase Frontend

- [x] Purchase一覧
- [x] Purchase登録
- [x] Purchase詳細
- [x] Purchase編集
- [x] Purchase削除
- [x] Category
- [x] PurchasedAt
- [x] Price
- [x] Shop
- [x] Description
- [x] 複数画像
- [x] Preview
- [x] Responsive
- [x] 全Theme表示確認

---

# 92. Phase 10 — Entry × Purchase

## DB

- [x] `entry_purchases`
- [x] 独立ULID `id`
- [x] `(entry_id, purchase_id)` Unique
- [x] `entry_purchases_log`
- [x] bigint IdentityログID
- [x] source_id
- [x] Trigger
- [x] Index
- [x] Migration
- [x] ログ確認

## Application

- [x] EntryからPurchase関連付け
- [x] 関連解除
- [x] Entry詳細表示
- [x] Purchase詳細表示
- [x] Entry登録時Purchase選択
- [x] Entry編集時Purchase選択
- [x] Purchase選択UI
- [x] Purchase検索UI

---

# 93. Phase 11 — UX改善

- [x] Entryフォーム簡略化
- [x] Optional項目折りたたみ
- [x] Loading統一
- [x] Error統一
- [x] Success通知
- [x] Delete Dialog
- [x] Empty State
- [x] 画像表示改善
- [x] 入力データ誤消失対策
- [ ] Smartphone UX
- [ ] Light UX
- [ ] Dark UX
- [ ] Capture UX

---

# 94. Phase 12 — 検索

## Entry

- [x] 本文
- [x] Tag
- [x] 日付
- [x] Emotion
- [x] Location

## Purchase

- [x] Name
- [x] Category
- [x] 購入日
- [x] Shop
- [x] 金額

専用検索エンジンは導入しない。

---

# 95. Phase 13 — Docker / Raspberry Pi

- [ ] Frontend Dockerfile
- [ ] Backend Dockerfile
- [ ] PostgreSQL Docker
- [ ] Docker Compose
- [ ] PostgreSQL永続化
- [ ] Image Storage永続化
- [ ] ARM64
- [ ] Raspberry Pi起動
- [ ] LAN内PC
- [ ] LAN内Smartphone
- [ ] Raspberry Pi再起動
- [ ] Container自動再起動
- [ ] image.root_path設定変更確認
- [ ] README

---

# 96. Phase 14 — Backup / Restore

- [ ] PostgreSQL Backup
- [ ] PostgreSQL Restore
- [ ] Image Storage Backup
- [ ] Image Storage Restore
- [ ] DB + Images一式管理
- [ ] app_settings復元確認
- [ ] ログ復元確認
- [ ] Raspberry Pi故障時復旧
- [ ] README

---

# 97. Version 0.1 完成条件

## Entry

- [ ] 登録
- [ ] 一覧
- [ ] 詳細
- [ ] 編集
- [ ] 削除
- [ ] 複数画像
- [ ] Tag
- [ ] Emotion
- [ ] Weather
- [ ] Location

## Purchase

- [ ] 登録
- [ ] 一覧
- [ ] 詳細
- [ ] 編集
- [ ] 削除
- [ ] 複数画像
- [ ] Category

## Relation

- [ ] Entry × Tag 中間テーブルに独立ULID ID
- [ ] Entry × Purchase 中間テーブルに独立ULID ID
- [ ] EntryからPurchaseを開ける
- [ ] PurchaseからEntryを確認できる

## Settings

- [ ] app_settingsが存在する
- [ ] 原則設定値をDB管理している
- [ ] image.root_pathをDB管理している
- [ ] Settings画面から変更できる
- [ ] 設定変更履歴がログへ保存される

## Theme

- [ ] Light
- [ ] Dark
- [ ] Capture
- [ ] テーマを選択できる
- [ ] 選択テーマをDB保存できる
- [ ] 再アクセス後もテーマが維持される
- [ ] Captureテーマが指定Paletteに従っている

## Database

- [ ] PostgreSQL
- [ ] 通常テーブルIDはULID
- [ ] 中間テーブルIDもULID
- [ ] 全通常テーブルに対応ログが存在
- [ ] ログIDはbigint Identity
- [ ] INSERTログ
- [ ] UPDATEログ
- [ ] 過去ログを上書きしない
- [ ] source_idから元レコードを識別可能
- [ ] ログに通常テーブルへのFKがない
- [ ] Migration管理

## Image

- [ ] ファイルシステム保存
- [ ] DBには相対パス
- [ ] image.root_pathはDB設定
- [ ] Windows / Linux双方を考慮

## Client

- [ ] PC
- [ ] Smartphone
- [ ] Tablet

## Infrastructure

- [ ] Docker Compose
- [ ] DB永続化
- [ ] Image永続化
- [ ] Backup / Restore手順

---

# 98. Version 0.1に含めないもの

以下は明示的な追加指示がない限り実装しない。

- Authentication
- User管理
- インターネット公開
- Markdown
- PWA
- Offline
- GPS
- 地図API
- 天気API
- 店舗マスタ
- Locationマスタ
- Emotionマスタ編集
- 多通貨
- Elasticsearch等
- 自動Backup
- カレンダー
- 支出グラフ
- 感情グラフ
- AI機能
- ログ閲覧画面
- ログ履歴API
- DELETEログ
- ユーザー独自テーマ作成
- テーマ色編集

---

# 99. 将来機能候補

## Wiki

- Entry同士のLink
- Backlink
- Favorite
- Pin
- Person
- Place
- Book
- Movie
- Game

## Journal

- Emotion統計
- 月間振り返り
- 年間振り返り
- 1年前の今日
- Journaling Template

## Purchase

- 月別支出
- Category別支出
- 店舗別支出
- Subscription
- Graph

## History

- Entry変更履歴
- Purchase変更履歴
- 設定変更履歴
- Version比較
- 過去状態復元
- DELETEログ

## Appearance

- Custom Theme
- Theme Editor

## その他

- Markdown
- PWA
- Offline
- Export
- Import
- 自動Backup
- Weather API
- Location API
- Authentication

---

# 100. Codex実装ルール

## Scope

- 指定Phaseのみ実装する
- 後続Phaseを先行実装しない
- SPECにない機能を追加しない
- 過剰な抽象化を行わない
- 技術スタックを独断で変更しない

---

## Database

- DB変更は必ずMigrationで管理する
- 通常テーブルIDはULID
- 中間テーブルにも独立したULID IDを持たせる
- 中間テーブルの関連カラムにはUnique Constraintを適切に設定する
- 複合Primary Keyを原則使用しない
- ログテーブルIDはbigint Identity
- ログテーブルIDにULIDを使用しない
- 通常テーブル作成時はログテーブルも作成する
- INSERT / UPDATE Triggerを作成する
- 通常テーブル変更時はログテーブルも確認する
- ログテーブルから元テーブルへのFKは設定しない

---

## Settings

- 設定値は原則DBで管理する
- DB接続前に必要な設定のみ環境変数を使用する
- 設定値をソースへハードコードしない
- `image.root_path` はDB管理する
- `appearance.theme` はDB管理する
- 設定取得処理は共通化する

---

## Backend

- Controllerにビジネスロジックを詰め込まない
- DTO Validationを行う
- `any` を極力使用しない
- エラーを握りつぶさない
- ログテーブルへServiceから直接INSERTしない
- Setting取得を各Serviceへ重複実装しない

---

## Frontend

- TypeScriptを適切に使用する
- API通信をComponentへ重複実装しない
- ThemeをSemantic Tokenで管理する
- ComponentへColor Hexを無秩序にハードコードしない
- Light / Dark / Captureすべてで確認する
- PC / Smartphone双方を考慮する
- Hoverだけに依存しない
- Entry登録操作を増やしすぎない

---

## File

- ファイル名衝突を防ぐ
- Path生成を共通化
- Windows / Linux対応
- 画像形式Validation
- サイズValidation
- DBには相対パスのみ
- Root Pathはapp_settingsから取得

---

# 101. CodexによるSPEC変更ルール

Codexは完了Todoのみ、

```text
- [ ] 未完了
```

から、

```text
- [x] 完了
```

へ変更してよい。

以下を独断で変更してはならない。

- Requirements
- 技術スタック
- ULID方針
- 中間テーブルID方針
- ログ仕様
- Settings方針
- Theme仕様
- Phase構成
- Version 0.1 Scope

仕様変更が必要と判断した場合は、勝手に実装せず変更案を提示する。

---

# 102. Codexへの基本指示

各Phase開始時は以下を基本プロンプトとする。

```text
docs/SPEC.mdを最初にすべて確認してください。

今回はPhase Xのみを実装してください。
後続Phaseの機能は先行実装しないでください。

最初に現在のリポジトリと、これまでのPhaseの実装状況を確認してください。

実装前に簡潔に、

1. 今回実装する内容
2. 追加・変更する主要ファイル
3. 実装方針
4. DB / Migration変更内容
5. ログテーブル / Triggerへの影響
6. Settingsへの影響
7. Themeへの影響
8. 仕様上の不明点・問題点

を整理してください。

重大な仕様不明点がなければ、そのまま実装してください。

DBテーブルを追加する場合、
通常テーブルには独立したULIDのidを持たせてください。
中間テーブルにも独立したULIDのidを持たせてください。

通常テーブルを作成する場合は、
対応するログテーブルも作成してください。

ログテーブルのPrimary Keyは、

id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY

を基本としてください。

通常テーブルのidはログテーブルのsource_idへ保存してください。

INSERT / UPDATE時はPostgreSQL Triggerによって
変更後のレコード全体をログテーブルへ保存してください。

設定値は原則app_settingsへ保存してください。
DB接続前に必要な設定以外を安易に環境変数へ追加しないでください。

UIの色はThemeのSemantic Tokenを利用してください。
Light / Dark / Captureの3テーマを考慮してください。

実装後は可能な範囲で、

- build
- lint
- type check
- test
- migration
- 起動確認

を実施してください。

DB変更がある場合は最低限、

- Migration up
- INSERT
- INSERTログ確認
- UPDATE
- UPDATEログ確認
- 複数UPDATEで履歴が残ること

を確認してください。

最後に、

1. 実装内容
2. 変更・追加した主要ファイル
3. DB / Migration変更
4. ログ関連変更
5. Settings関連変更
6. Theme関連変更
7. 実施した確認と結果
8. 未解決事項
9. 次Phase前に確認すべきこと

を報告してください。

完了したTodoはSPEC.mdのチェックボックスを更新してください。

SPEC.mdにない機能を勝手に追加しないでください。
```

---

# 103. 実装判断に迷った場合

以下の順で判断する。

1. SPECに明記された要件
2. データを失わないこと
3. 記録しやすいこと
4. シンプルで保守しやすいこと
5. PC / Smartphone双方で使いやすいこと
6. Raspberry Piへ移行しやすいこと
7. 将来拡張を完全に妨げない程度の設計

「将来的に使うかもしれない」という理由だけで複雑化しない。

仕様に影響する判断が必要な場合は、独断で決定しない。

---

# 104. 最終目標

`monolog` の目的は、単にデータを登録することではない。

```text
出来事
   ↓
感情
   ↓
場所
   ↓
写真
   ↓
買ったもの
   ↓
その後の感想
```

といった個人的な情報を少しずつ蓄積し、それぞれを後から辿れるようにする。

DBではINSERT / UPDATE時の状態を履歴として保持し、情報がどのように変化したのかも追跡可能にする。

設定についてもDBで一元管理し、PCからRaspberry Piへ環境が変わってもアプリケーションの設定を管理しやすくする。

また、Light / Darkに加え、ユーザー指定のCaptureテーマを提供し、用途や気分に応じて見た目を変更できるようにする。

最終的には、

**「過去の自分と、その変化を検索・閲覧できる個人用Wiki」**

を目指す。

機能数よりも、

**記録しやすいこと、失わないこと、あとから辿りやすいこと**

を優先する。
