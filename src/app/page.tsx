const demoEndpoint = "/api/metrics-demo";

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <p className="eyebrow">Next.js + OpenTelemetry</p>
        <h1>カスタムメトリクスを Grafana OTel LGTM に送信するサンプル</h1>
        <p>
          このアプリは Next.js の <code>instrumentation.ts</code> から OpenTelemetry を初期化し、 API Route で counter
          と histogram を記録します。
        </p>
      </section>

      <section className="card">
        <h2>メトリクスを発火する</h2>
        <p>次の endpoint を数回呼び出すと、Collector 経由で Grafana OTel LGTM に custom metrics が送信されます。</p>
        <a href={demoEndpoint}>{demoEndpoint}</a>
        <pre>curl http://localhost:3000{demoEndpoint}</pre>
      </section>
    </main>
  );
}
