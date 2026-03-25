import { Elysia } from "elysia";
import { usersRouter } from "../src/modules/users";

export function createTestApp() {
  return new Elysia()
    .get("/api/health", () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    })
    .use(usersRouter);
}
