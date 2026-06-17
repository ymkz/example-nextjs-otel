# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## ルール・制約

- 依存バージョンは `package.json` に直接書かず、`pnpm-workspace.yaml` の `catalog` に固定する。
- `package.json` の dependency/devDependency は `catalog:` を参照する。
- Node.js は `devEngines.runtime`、pnpm は `devEngines.packageManager` で管理する。
- pnpm の build script 承認は `pnpm-workspace.yaml` の `allowBuilds` で管理する。
- `tsconfig.json` に `compilerOptions.paths` を追加しない。import alias `@/` は使わない。
- Docker Compose ファイル名は `compose.yaml` を使う。
- SigNoz 前提の記述・設定を追加しない。ローカル observability は Grafana OTel LGTM を使う。
- アプリは直接 LGTM に送らず、app-local Collector 経由にする。
- OpenTelemetry Node SDK は Edge Runtime で import しない。
- `src/instrumentation.ts` は `NEXT_RUNTIME === "nodejs"` のときだけ `src/instrumentation.node.ts` を読み込む。
- instrumentation file は `src` 直下に置く。`src/app` 配下には置かない。
- custom metrics は `src/lib/otel/metrics.ts` に集約する。
- メトリクス属性に `user_id`、`email`、`request_id`、token など高カーディナリティ値や個人情報を入れない。
- API route で OTel metrics を扱う場合は Node.js runtime を明示する。
- `Dockerfile` は Next.js standalone output 前提を維持する。
- Docker build では pnpm の BuildKit cache mount、`pnpm fetch`、`pnpm install --offline` の構成を維持する。
- format は `oxfmt`、lint は `oxlint` を使う。別 formatter/linter を追加しない。
- 設定ファイルは JSONC を優先する。既存の `.oxfmtrc.jsonc` / `.oxlintrc.jsonc` を使う。

## よく使うコマンド

- install: `pnpm install`
- dev: `cp .env.example .env.local && pnpm dev`
- stop dev services: `pnpm dev:down`
- build: `pnpm build`
- start standalone: `pnpm start`
- typecheck: `pnpm typecheck`
- lint: `pnpm lint`
- lint fix: `pnpm lint:fix`
- format check: `pnpm fmt`
- format fix: `pnpm fmt:fix`
- test: `pnpm test`（現状は placeholder。単一テスト実行コマンドは未定義）
- compose app stack: `docker compose up --build`
- Collector logs: `docker compose logs otel-collector`
- LGTM logs: `pnpm lgtm:logs`

## 構成メモ

- Next.js App Router アプリ。`src/app/api/metrics-demo/route.ts` が demo metrics を発火する。
- telemetry flow: `Next.js app -> app-local Collector -> Grafana OTel LGTM`。
- host dev の OTLP endpoint は `.env.local` の `http://localhost:14318`。
- Compose 内 app の OTLP endpoint は `http://otel-collector:4318`。
- Grafana UI は `http://localhost:3001`。
- Collector 設定は `otel-collector-config.yaml`。LGTM へ `otel-lgtm:4317` で OTLP gRPC 転送する。
- Grafana Explore では `{__name__=~"app_.*"}` で metric 名を確認する。OTel の `.` は Prometheus 側で `_` に変換されることがある。
