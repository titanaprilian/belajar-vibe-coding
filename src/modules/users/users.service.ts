import { db } from '../../db';
import { users, sessions } from './users.schema';
import { eq, count } from 'drizzle-orm';
import type { User, NewUser } from './users.schema';
import argon2 from 'argon2';

export async function getAllUsers(): Promise<User[]> {
  return db.select().from(users);
}

export async function getUsers(page: number, size: number) {
  const offset = (page - 1) * size;
  
  const usersData = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    createdAt: users.createdAt,
  }).from(users).limit(size).offset(offset);
  
  const totalRecordsResult = await db.select({ count: count() }).from(users);
  const totalRecords = totalRecordsResult[0]!.count;
  
  const totalPages = Math.ceil(totalRecords / size);
  
  const nextUrl = page < totalPages ? `/api/users?page=${page + 1}&size=${size}` : null;
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

export async function getUserById(id: number): Promise<User[]> {
  return db.select().from(users).where(eq(users.id, id));
}

export async function createUser(data: NewUser) {
  return db.insert(users).values(data);
}

export async function updateUser(id: number, data: Partial<Pick<User, 'name' | 'email'>>) {
  return db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  return db.delete(users).where(eq(users.id, id));
}

export async function registerUser(name: string, email: string, password: string) {
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    throw new Error('Email is already in use');
  }
  
  const hashedPassword = await argon2.hash(password);
  await db.insert(users).values({ name, email, password: hashedPassword });
  return 'OK';
}

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomUUID();
  await db.insert(sessions).values({ token, userId });
  return token;
}

export async function loginUser(email: string, password: string): Promise<string> {
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  
  if (existingUser.length === 0) {
    throw new Error('Email or password is wrong');
  }
  
  const user = existingUser[0]!;
  const isValidPassword = await argon2.verify(user.password, password);
  
  if (!isValidPassword) {
    throw new Error('Email or password is wrong');
  }
  
  return createSession(user.id);
}
