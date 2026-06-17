# example-nextjs-otel

Next.js App Router から OpenTelemetry の traces と custom metrics を送信し、ローカルの OpenTelemetry Collector / Grafana OTel LGTM で確認するサンプルです。

## 構成

```text
Next.js app
  -> OTLP HTTP http://otel-collector:4318
  -> app-local OpenTelemetry Collector
  -> Grafana OTel LGTM
  -> Grafana UI http://localhost:3001
```

本番では、アプリの近くに OpenTelemetry Collector sidecar を置き、central Collector gateway や central observability backend に転送する構成を推奨します。

```text
App container
  -> localhost:4318
  -> OpenTelemetry Collector sidecar
  -> central Collector gateway / central observability backend
```

## 主なファイル

- `src/instrumentation.ts`: Next.js の instrumentation entrypoint
- `src/instrumentation.node.ts`: OpenTelemetry Node SDK の初期化
- `src/lib/otel/metrics.ts`: custom metrics の定義
- `src/app/api/metrics-demo/route.ts`: custom metrics を発火する demo API
- `otel-collector-config.yaml`: app-local Collector の設定
- `compose.yaml`: app、app-local Collector、Grafana OTel LGTM の Compose 設定

## セットアップ

依存ライブラリのバージョンは `pnpm-workspace.yaml` の `catalog` で固定管理しています。`package.json` 側は `catalog:` を参照します。Node.js は `package.json` の `devEngines.runtime` で `26.3.0` に固定しています。

```bash
pnpm install
```

pnpm が build scripts を保留した場合は、必要に応じて内容を確認してから承認してください。

```bash
pnpm approve-builds
```

## 開発用サービスをまとめて起動・停止する

Wireit で Next.js dev server、app-local Collector、Grafana OTel LGTM をまとめて起動します。

```bash
cp .env.example .env.local
pnpm dev
```

`pnpm dev` は次を起動します。

- `dev:next`: `next dev`
- `dev:collector`: `docker compose up otel-lgtm otel-collector`

停止するときは `Ctrl-C` で Wireit 管理下のプロセスを止めます。残った Compose リソースを明示的に片付けたい場合は次を実行します。

```bash
pnpm dev:down
```

custom metrics を発火します。

```bash
curl http://localhost:3000/api/metrics-demo
```

## Grafana OTel LGTM を確認する

Grafana UI は次で開きます。

```text
http://localhost:3001
```

OTLP endpoint は次を使います。

- app-local Collector gRPC: `localhost:14317`
- app-local Collector HTTP: `localhost:14318`
- Grafana OTel LGTM gRPC: `localhost:4317`
- Grafana OTel LGTM HTTP: `localhost:4318`

このリポジトリでは、本番の sidecar 構成に近づけるため、アプリは直接 LGTM に送らず app-local Collector に送ります。

```text
Next.js app -> app-local Collector -> Grafana OTel LGTM
```

ホストで `pnpm dev` を使う場合、Next.js は `.env.local` の次の値で app-local Collector に送ります。

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:14318
```

Compose 内の `app` service からは次で送ります。

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

Grafana UI では、Explore から metrics datasource を選び、`app.demo.requests` や `app.demo.request.duration` を検索します。traces では `GET /api/metrics-demo` 相当の span を確認できます。

LGTM のログを見る場合:

```bash
pnpm lgtm:logs
```

## production build をホストで確認する

`output: 'standalone'` を使っているため、`next start` ではなく standalone server を起動します。

```bash
pnpm build
pnpm start
```

## app も含めて Docker Compose で起動する

アプリも含めてコンテナで動かす場合は、このリポジトリの Compose を起動します。

```bash
docker compose up --build
```

custom metrics を発火します。

```bash
curl http://localhost:3000/api/metrics-demo
curl http://localhost:3000/api/metrics-demo
curl http://localhost:3000/api/metrics-demo
```

Collector ログを確認します。

```bash
docker compose logs otel-collector
```

Grafana UI で以下を確認します。

- traces に `GET /api/metrics-demo` 相当が表示される
- metrics explorer で `app.demo.requests` が表示される
- metrics explorer で `app.demo.request.duration` が表示される

## OpenTelemetry 設定

`src/instrumentation.ts` は Node.js runtime の場合だけ `src/instrumentation.node.ts` を読み込みます。Edge Runtime では `@opentelemetry/sdk-node` を読み込まないようにしています。

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
```

OTLP exporter は環境変数 `OTEL_EXPORTER_OTLP_ENDPOINT` を基準に、signal ごとの endpoint に送信します。

- traces: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
- metrics: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`

## custom metrics

`src/lib/otel/metrics.ts` で次の metrics を定義しています。

- `app.demo.requests`: demo API のリクエスト数
- `app.demo.request.duration`: demo API の処理時間 histogram
- `app.business.events`: サンプル業務イベント数

属性は低カーディナリティの値に限定してください。

良い例:

- `route`
- `method`
- `status_code`
- `feature`
- `result`

避ける例:

- `user_id`
- `email`
- `request_id`
- token や個人情報

## 検証

```bash
pnpm lint
pnpm fmt
pnpm typecheck
pnpm build
```

Docker まで含めて確認する場合:

```bash
docker compose up --build
curl http://localhost:3000/api/metrics-demo
docker compose logs otel-collector
```
