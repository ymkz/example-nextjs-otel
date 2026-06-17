import { NextResponse } from "next/server";

import { businessEventCounter, demoRequestCounter, demoRequestDuration } from "../../../lib/otel/metrics";

export const runtime = "nodejs";

const route = "/api/metrics-demo";

export async function GET() {
  const startedAt = performance.now();
  let statusCode = 200;

  try {
    businessEventCounter.add(1, {
      feature: "metrics-demo",
      result: "success",
    });

    return NextResponse.json({
      ok: true,
      message: "custom metrics emitted",
    });
  } catch (error) {
    statusCode = 500;
    throw error;
  } finally {
    const durationMs = performance.now() - startedAt;
    const attributes = {
      route,
      method: "GET",
      status_code: statusCode,
    };

    demoRequestCounter.add(1, attributes);
    demoRequestDuration.record(durationMs, attributes);
  }
}
