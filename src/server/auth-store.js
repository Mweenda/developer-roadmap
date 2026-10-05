import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createFileJsonIo } from './json-io.js';

const scryptAsync = promisify(scrypt);
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeUsername(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function validUsername(username) {
  return /^[a-z0-9_]{3,32}$/.test(username);
}

async function hashPassword(password, salt = randomBytes(16)) {
  const derived = await scryptAsync(password, salt, 64);
  return { hash: Buffer.from(derived).toString('hex'), salt: salt.toString('hex') };
}

async function passwordsMatch(password, saltHex, hashHex) {
  const derived = Buffer.from(await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64));
  const expected = Buffer.from(hashHex, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function parseCookies(header) {
  const cookies = {};
  if (typeof header !== 'string' || !header) return cookies;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export function sessionCookie(token, { secure = false } = {}) {
  const parts = [
    `__session=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_MS / 1000)}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie({ secure = false } = {}) {
  const parts = ['__session=', 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function sessionTokenFrom(header) {
  const cookies = parseCookies(header);
  return cookies.__session || cookies.sid || '';
}

export function publicUser(user) {
  return { id: user.id, username: user.username, name: user.name };
}

export function createAuthStore(filePath, { jsonIo } = {}) {
  let writeQueue = Promise.resolve();
  const io = jsonIo ?? createFileJsonIo(filePath);

  function sanitize(parsed) {
    const users = Array.isArray(parsed.users)
      ? parsed.users.filter((user) => isPlainObject(user) && typeof user.id === 'string' && validUsername(user.username) && typeof user.hash === 'string' && typeof user.salt === 'string')
      : [];
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.filter((session) => isPlainObject(session) && typeof session.token === 'string' && typeof session.userId === 'string')
      : [];
    return { users, sessions };
  }

  async function read() {
    const parsed = await io.read();
    if (!parsed) return { users: [], sessions: [] };
    return sanitize(parsed);
  }

  async function write(next) {
    return io.write(next);
  }

  function enqueue(work) {
    const operation = writeQueue.then(work);
    writeQueue = operation.catch(() => {});
    return operation;
  }

  async function register({ name, username, password }) {
    const display = typeof name === 'string' ? name.trim() : '';
    const login = normalizeUsername(username);
    if (!display) throw invalid('INVALID_AUTH', 'name is required');
    if (!validUsername(login)) throw invalid('INVALID_AUTH', 'username must be 3–32 letters, numbers, or underscores');
    if (typeof password !== 'string' || password.length < 8) throw invalid('INVALID_AUTH', 'password must be at least 8 characters');
    return enqueue(async () => {
      const current = await read();
      if (current.users.some((user) => user.username === login)) throw invalid('CONFLICT', 'username is already taken');
      const { hash, salt } = await hashPassword(password);
      const user = {
        id: randomBytes(12).toString('hex'),
        username: login,
        name: display.slice(0, 80),
        hash,
        salt,
        createdAt: new Date().toISOString(),
      };
      const token = randomBytes(24).toString('hex');
      current.users.push(user);
      current.sessions = current.sessions.filter((session) => Date.parse(session.createdAt) > Date.now() - SESSION_MS);
      current.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
      await write(current);
      return { user: publicUser(user), token };
    });
  }

  async function login({ username, password }) {
    const loginName = normalizeUsername(username);
    if (!loginName || typeof password !== 'string') throw invalid('INVALID_AUTH', 'username and password are required');
    return enqueue(async () => {
      const current = await read();
      const user = current.users.find((item) => item.username === loginName);
      if (!user || !(await passwordsMatch(password, user.salt, user.hash))) {
        throw invalid('UNAUTHORIZED', 'Invalid username or password');
      }
      const token = randomBytes(24).toString('hex');
      current.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
      await write(current);
      return { user: publicUser(user), token };
    });
  }

  async function logout(token) {
    if (!token) return enqueue(async () => read());
    return enqueue(async () => {
      const current = await read();
      current.sessions = current.sessions.filter((session) => session.token !== token);
      return write(current);
    });
  }

  async function userFromToken(token) {
    if (!token) return null;
    const current = await read();
    const session = current.sessions.find((item) => item.token === token);
    if (!session) return null;
    if (Date.parse(session.createdAt) < Date.now() - SESSION_MS) return null;
    const user = current.users.find((item) => item.id === session.userId);
    return user ? publicUser(user) : null;
  }

  async function renameUser(userId, name) {
    const display = typeof name === 'string' ? name.trim() : '';
    if (!display) throw invalid('INVALID_LEARNER', 'name is required');
    return enqueue(async () => {
      const current = await read();
      const user = current.users.find((item) => item.id === userId);
      if (!user) throw invalid('UNAUTHORIZED', 'Sign in required');
      user.name = display.slice(0, 80);
      await write(current);
      return publicUser(user);
    });
  }

  return { register, login, logout, userFromToken, renameUser };
}
