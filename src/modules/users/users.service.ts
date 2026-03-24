import { db } from '../../db';
import { users, sessions } from './users.schema';
import { eq } from 'drizzle-orm';
import type { User, NewUser } from './users.schema';
import argon2 from 'argon2';

export async function getUsers(): Promise<User[]> {
  return db.select().from(users);
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
