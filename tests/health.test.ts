import { describe, test, expect } from "bun:test";
import { createTestApp } from "./app";

describe("GET /api/health", () => {
  const app = createTestApp();

  test("GET /api/health returns 200", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
  });
});
