import { describe, test, expect, beforeEach } from "bun:test";
import { createTestApp } from "../app";
import { truncateTables } from "../db";
import { db } from "../../src/db";
import { users } from "../../src/modules/users/users.schema";
import argon2 from "argon2";

describe("GET /api/users", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(async () => {
    await truncateTables();
    app = createTestApp();

    for (let i = 1; i <= 5; i++) {
      await db.insert(users).values({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: await argon2.hash("password123"),
      });
    }
  });

  test("Request without query params → 200 with defaults", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(body.meta.current_page).toBe(1);
    expect(body.meta.page_size).toBe(10);
  });

  test("Request with page=1&size=2 → 2 items, total 5", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users?page=1&size=2")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta.total_records).toBe(5);
    expect(body.meta.next_url).not.toBeNull();
  });

  test("Request on last page → next_url is null", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users?page=3&size=2")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meta.next_url).toBeNull();
  });

  test("Request on first page → prev_url is null", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users?page=1&size=2")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meta.prev_url).toBeNull();
  });

  test("Response never contains password field", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    for (const user of body.data) {
      expect(user).not.toHaveProperty("password");
    }
  });

  test("Request with page=0 → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users?page=0")
    );

    expect(response.status).toBe(422);
  });

  test("Request with size=0 → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users?size=0")
    );

    expect(response.status).toBe(422);
  });

  test("Request with size=101 → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users?size=101")
    );

    expect(response.status).toBe(422);
  });
});
