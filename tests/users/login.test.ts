import { describe, test, expect, beforeEach } from "bun:test";
import { createTestApp } from "../app";
import { truncateTables } from "../db";
import { db } from "../../src/db";
import { users } from "../../src/modules/users/users.schema";
import argon2 from "argon2";

describe("POST /api/users/login", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(async () => {
    await truncateTables();
    app = createTestApp();

    await db.insert(users).values({
      name: "John Doe",
      email: "john@example.com",
      password: await argon2.hash("password123"),
    });
  });

  test("Login with correct credentials → 200 with token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
  });

  test("Login with correct email but wrong password → 400", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "wrongpassword",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Email or password is wrong" });
  });

  test("Login with non-existent email → 400", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Email or password is wrong" });
  });

  test("Login with invalid email format → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "notanemail",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("Login with empty password → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "",
        }),
      })
    );

    expect(response.status).toBe(422);
  });
});
