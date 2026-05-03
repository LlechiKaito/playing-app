# 🎤 カラオケ対戦アプリ

DAM の採点結果画像を OCR で読み取り、ユーザー同士が非同期で対戦できるカラオケバトルアプリ。

## ローカル起動（Docker Compose）

```bash
cp .env.example .env
docker compose up --build
```

起動するサービス:

| サービス | URL | 用途 |
|---------|-----|------|
| Web (Next.js) | http://localhost:3000 | フロントエンド |
| API (Apollo Server) | http://localhost:4000/graphql | GraphQL API |
| DynamoDB Local | http://localhost:8000 | データベース |
| MinIO | http://localhost:9001 (console) / http://localhost:9000 (API) | S3 互換ストレージ |

初回起動時、`api` コンテナが DynamoDB のテーブル作成と MinIO バケット作成を自動で行う。

## 主な画面

- `/` トップ
- `/login` ログイン
- `/signup` 新規登録
- `/mypage` プロフィール / レート確認
- `/battles` 対戦募集一覧
- `/battles/new` 対戦作成
- `/battles/:id` 対戦ルーム
- `/battles/:id/submit` 採点画像提出
- `/battles/:id/result` 結果画面
- `/ranking` ランキング

## 技術構成

| レイヤ | ローカル | プロダクション（CDK で deploy） |
|--------|---------|------------------------------|
| Frontend | Next.js (App Router) | S3 + CloudFront |
| GraphQL | Apollo Server v4 | AWS AppSync |
| Auth | 自前 JWT | Cognito User Pool |
| DB | DynamoDB Local | DynamoDB |
| Storage | MinIO | S3 |
| OCR | モック | Textract |

## 開発コマンド

```bash
pnpm install                  # 依存解決
pnpm --filter web dev         # Next.js 単体起動
pnpm --filter api dev         # Apollo Server 単体起動
pnpm test                     # ユニット
pnpm test:e2e                 # 軽い E2E（Next dev に対するスモーク）

# 完全 E2E（2 ブラウザで対戦成立まで）
docker compose up -d --build
pnpm --filter web exec playwright install --with-deps chromium  # 初回のみ
pnpm --filter web run test:e2e:integration
docker compose down -v
```

## デプロイ用 CDK（`infra/`）

ECS Fargate + ALB + DynamoDB + S3 のスタックを定義。
**デプロイは人間が実行する**。AI は synth / diff まで。

```bash
pnpm --filter infra run synth                    # CloudFormation 合成
pnpm --filter infra run diff                     # 差分確認
pnpm --filter infra run test                     # CDK assertion
# pnpm --filter infra exec cdk deploy --all      # ← 人間がやる
```

## 動作確認

```bash
# 1. 起動
docker compose up --build

# 2. ヘルスチェック
curl http://localhost:4000/health

# 3. GraphQL playground
open http://localhost:4000/graphql

# 4. Web を開く
open http://localhost:3000
```
