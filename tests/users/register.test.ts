import { describe, test, expect, beforeEach } from "bun:test";
import { createTestApp } from "../app";
import { truncateTables } from "../db";

describe("POST /api/users", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(async () => {
    await truncateTables();
    app = createTestApp();
  });

  test("Register with valid data → 201", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: "OK" });
  });

  test("Register with duplicate email → 400", async () => {
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Email is already in use" });
  });

  test("Register with invalid email format → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "notanemail",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("Register with password shorter than 8 characters → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "short",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("Register with empty name → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("Register with name exceeding 255 characters → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "A".repeat(300),
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });
});
