import crypto from 'crypto';
import { getAdminPasswordHash, saveAdminPasswordHash } from './db';
import { NextRequest } from 'next/server';

import { verifySessionToken, getSessionCookieName } from './auth-session';

export { createSessionToken, verifySessionToken, getSessionCookieName } from './auth-session';

const ITERATIONS = 100000;
const KEY_LEN = 64;
const ALGORITHM = 'sha512';
const DEFAULT_SALT = 'default_pbkdf2_salt_value_2026';

export function hashPassword(password: string, salt: string = DEFAULT_SALT): string {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, ALGORITHM).toString('hex');
  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const storedHash = await getAdminPasswordHash();
  if (!storedHash) return false;

  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const hash = parts[3];

  const computedHash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, ALGORITHM).toString('hex');
  return computedHash === hash;
}

export async function updatePassword(newPassword: string): Promise<boolean> {
  if (!newPassword || newPassword.length < 6 || newPassword.length > 128) {
    return false;
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(newPassword, salt);
  await saveAdminPasswordHash(hash);
  return true;
}

export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const cookieName = getSessionCookieName();
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
