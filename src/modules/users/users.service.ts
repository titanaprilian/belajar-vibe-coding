import { db } from "../../db";
import { users, sessions } from "./users.schema";
import { eq, count } from "drizzle-orm";
import argon2 from "argon2";

export async function getUsers(page: number, size: number) {
  const offset = (page - 1) * size;

  const usersData = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .limit(size)
    .offset(offset);

  const totalRecordsResult = await db.select({ count: count() }).from(users);
  const totalRecords = totalRecordsResult[0]!.count;

  const totalPages = Math.ceil(totalRecords / size);

  const nextUrl =
    page < totalPages ? `/api/users?page=${page + 1}&size=${size}` : null;
  const prevUrl = page > 1 ? `/api/users?page=${page - 1}&size=${size}` : null;

  return {
    data: usersData,
    meta: {
      current_page: page,
      page_size: size,
      total_records: totalRecords,
      total_pages: totalPages,
      next_url: nextUrl,
      prev_url: prevUrl,
    },
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existingUser.length > 0) {
    throw new Error("Email is already in use");
  }

  const hashedPassword = await argon2.hash(password);
  await db.insert(users).values({ name, email, password: hashedPassword });
  return "OK";
}

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomUUID();
  await db.insert(sessions).values({ token, userId });
  return token;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<string> {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length === 0) {
    throw new Error("Email or password is wrong");
  }

  const user = existingUser[0]!;
  const isValidPassword = await argon2.verify(user.password, password);

  if (!isValidPassword) {
    throw new Error("Email or password is wrong");
  }

  return createSession(user.id);
}

export async function getCurrentUser(token: string) {
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (session.length === 0) {
    throw new Error("Unauthorized");
  }

  const userRecord = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session[0]!.userId));

  if (userRecord.length === 0) {
    throw new Error("Unauthorized");
  }

  return userRecord[0]!;
}

export async function updateCurrentUser(
  token: string,
  name: string,
  email: string,
) {
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (session.length === 0) {
    throw new Error("Unauthorized");
  }

  const userId = session[0]!.userId;

  const existingEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existingEmail.length > 0 && existingEmail[0]!.id !== userId) {
    throw new Error("The email should be a valid email");
  }

  await db.update(users).set({ name, email }).where(eq(users.id, userId));

  return "OK";
}

export async function updatePassword(
  token: string,
  oldPassword: string,
  newPassword: string,
) {
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (session.length === 0) {
    throw new Error("Unauthorized");
  }

  const userId = session[0]!.userId;

  const userRecord = await db.select().from(users).where(eq(users.id, userId));

  if (userRecord.length === 0) {
    throw new Error("Unauthorized");
  }

  const user = userRecord[0]!;
  const isValidPassword = await argon2.verify(user.password, oldPassword);

  if (!isValidPassword) {
    throw new Error("The old password is not match");
  }

  const hashedNewPassword = await argon2.hash(newPassword);
  await db
    .update(users)
    .set({ password: hashedNewPassword })
    .where(eq(users.id, userId));

  return "OK";
}

export async function logoutUser(token: string) {
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (session.length === 0) {
    throw new Error("Unauthorized");
  }

  await db.delete(sessions).where(eq(sessions.token, token));

  return "OK";
}
