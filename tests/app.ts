import { Elysia } from "elysia";
import { usersRouter } from "../src/modules/users";

export function createTestApp() {
  return new Elysia().use(usersRouter);
}
