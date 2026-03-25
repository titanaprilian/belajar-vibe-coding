import { beforeAll } from "bun:test";

beforeAll(async () => {
  if (process.env.NODE_ENV === "test") {
    await import("dotenv").then((dotenv) => dotenv.config({ path: ".env.test" }));
  }
});
