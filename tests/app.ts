import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRouter } from "../src/modules/users";

export function createTestApp() {
  return new Elysia()
    .use(swagger())
    .use(usersRouter);
}
