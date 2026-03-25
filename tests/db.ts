import { db } from "../src/db";
import { users, sessions } from "../src/modules/users/users.schema";

export async function truncateTables() {
  await db.delete(sessions);
  await db.delete(users);
}
