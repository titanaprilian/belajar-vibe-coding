import { db } from "../src/db";
import { users, sessions } from "../src/modules/users/users.schema";
import { eq } from "drizzle-orm";

export async function truncateTables() {
  await db.delete(sessions);
  await db.delete(users);
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
