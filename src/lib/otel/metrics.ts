import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("example-nextjs-otel");

export const demoRequestCounter = meter.createCounter("app.demo.requests", {
  description: "Number of demo API requests.",
  unit: "1",
});

export const demoRequestDuration = meter.createHistogram("app.demo.request.duration", {
  description: "Duration of demo API requests.",
  unit: "ms",
});

export const businessEventCounter = meter.createCounter("app.business.events", {
  description: "Number of business events emitted by the app.",
  unit: "1",
});
