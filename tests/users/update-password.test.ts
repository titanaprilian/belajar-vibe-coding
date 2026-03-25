import { describe, test, expect, beforeEach } from "bun:test";
import { createTestApp } from "../app";
import { truncateTables } from "../db";
import { db } from "../../src/db";
import { users, sessions } from "../../src/modules/users/users.schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";

describe("PUT /api/users/me/password", () => {
  let app: ReturnType<typeof createTestApp>;
  let token: string;

  beforeEach(async () => {
    await truncateTables();
    app = createTestApp();

    await db.insert(users).values({
      name: "John Doe",
      email: "john@example.com",
      password: await argon2.hash("oldpassword"),
    });

    const user = await db.select().from(users).where(eq(users.email, "john@example.com"));
    const userId = user[0]!.id;

    token = crypto.randomUUID();
    await db.insert(sessions).values({
      token,
      userId,
    });
  });

  test("Valid token and correct oldPassword → 200", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: "oldpassword",
          newPassword: "newpassword123",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: "OK" });
  });

  test("After update, logging in with new password succeeds", async () => {
    await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: "oldpassword",
          newPassword: "newpassword123",
        }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "newpassword123",
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
  });

  test("After update, logging in with old password fails", async () => {
    await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: "oldpassword",
          newPassword: "newpassword123",
        }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "oldpassword",
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  test("Wrong oldPassword → 400", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: "wrongpassword",
          newPassword: "newpassword123",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "The old password is not match" });
  });

  test("newPassword shorter than 8 characters → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: "oldpassword",
          newPassword: "short",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("Empty oldPassword → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: "",
          newPassword: "newpassword123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("Password fields exceeding 255 characters → 422", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: "A".repeat(300),
          newPassword: "newpassword123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("No Authorization header → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: "oldpassword",
          newPassword: "newpassword123",
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  test("Token does not exist → 401", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me/password", {
        method: "PUT",
        headers: {
          "Authorization": "Bearer invalid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: "oldpassword",
          newPassword: "newpassword123",
        }),
      })
    );

    expect(response.status).toBe(401);
  });
});
