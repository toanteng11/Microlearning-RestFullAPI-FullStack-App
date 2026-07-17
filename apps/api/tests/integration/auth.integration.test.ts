import mongoose from 'mongoose';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { AuthLoginStateModel } from '../../src/modules/auth/auth-login-state.model.js';
import { AuthSessionModel } from '../../src/modules/sessions/auth-session.model.js';
import { UserModel } from '../../src/modules/users/user.model.js';
import { testConfig, testRuntimeInfo } from '../test-fixtures.js';

const integrationUri = process.env.MONGODB_INTEGRATION_URI;
if (!integrationUri) throw new Error('MONGODB_INTEGRATION_URI is required for auth integration');

const app = createApp({
  config: { ...testConfig, mongodbUri: integrationUri },
  logger: pino({ level: 'silent' }),
  runtimeInfo: testRuntimeInfo,
  dependencies: { getDatabaseStatus: async () => 'UP' },
});

const registration = {
  fullName: 'Student Integration',
  email: 'student.integration@example.com',
  password: 'StrongPassword123!',
  confirmPassword: 'StrongPassword123!',
};

function getCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'];
  const value = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!value) throw new Error('Expected Set-Cookie response header');
  return value.split(';')[0]!;
}

describe('Authentication API integration', () => {
  beforeAll(async () => {
    await mongoose.connect(integrationUri, { serverSelectionTimeoutMS: 15_000 });
    await Promise.all([
      UserModel.syncIndexes(),
      AuthSessionModel.syncIndexes(),
      AuthLoginStateModel.syncIndexes(),
    ]);
  });

  beforeEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      AuthSessionModel.deleteMany({}),
      AuthLoginStateModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('registers one ACTIVE Student with Argon2id hash and no session', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(registration)
      .expect(201);

    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body.data).toMatchObject({
      user: {
        fullName: registration.fullName,
        email: registration.email,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      nextAction: 'LOGIN',
    });
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(response.body.data.user).not.toHaveProperty('capabilities');
    expect(await AuthSessionModel.countDocuments()).toBe(0);

    const stored = await UserModel.findOne({ email: registration.email }).select('+passwordHash');
    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/u);
    expect(stored?.passwordHash).not.toContain(registration.password);
  });

  it('rejects privilege injection, password boundary and duplicate email safely', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ ...registration, role: 'SUPER_ADMIN' })
      .expect(422);
    await request(app)
      .post('/api/v1/auth/register')
      .send({ ...registration, password: 'a'.repeat(11), confirmPassword: 'a'.repeat(11) })
      .expect(422);

    await request(app).post('/api/v1/auth/register').send(registration).expect(201);
    const duplicate = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...registration, fullName: 'Second Student' })
      .expect(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_RESOURCE');
    expect(await UserModel.countDocuments()).toBe(1);
  });

  it('logs in with refresh cookie, then reads and updates only the own safe profile', async () => {
    await request(app).post('/api/v1/auth/register').send(registration).expect(201);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registration.email, password: registration.password })
      .expect(200);

    const cookie = String(login.headers['set-cookie']);
    expect(cookie).toContain('ml_refresh=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/api/v1/auth');
    expect(login.body.data.accessToken).toEqual(expect.any(String));
    expect(login.body.data).not.toHaveProperty('refreshToken');

    const storedSession = await AuthSessionModel.findOne({}).select('+tokenHash');
    expect(storedSession?.tokenHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(cookie).not.toContain(storedSession!.tokenHash);

    const profile = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);
    expect(profile.body.data.user).toMatchObject({
      email: registration.email,
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    expect(JSON.stringify(profile.body)).not.toContain('passwordHash');

    const updated = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ fullName: 'Updated Student' })
      .expect(200);
    expect(updated.body.data.user.fullName).toBe('Updated Student');

    await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ role: 'ADMIN' })
      .expect(422);
  });

  it('returns the same generic failure for missing user and wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send(registration).expect(201);
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registration.email, password: 'WrongPassword123!' })
      .expect(401);
    const missingUser = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'missing@example.com', password: 'WrongPassword123!' })
      .expect(401);

    expect(wrongPassword.body.error).toEqual(missingUser.body.error);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rotates refresh tokens, keeps grace races safe and revokes reuse outside grace', async () => {
    await request(app).post('/api/v1/auth/register').send(registration).expect(201);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registration.email, password: registration.password })
      .expect(200);
    const oldCookie = getCookie(login);

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', oldCookie)
      .expect(200);
    const newCookie = getCookie(refreshed);
    expect(newCookie).not.toBe(oldCookie);

    const race = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', oldCookie)
      .expect(409);
    expect(race.body.error.code).toBe('REFRESH_RACE_RETRY');
    expect(race.headers['set-cookie']).toBeUndefined();

    await AuthSessionModel.updateOne(
      { status: 'ROTATED' },
      { $set: { rotatedAt: new Date(Date.now() - 10_000) } },
    );
    const reuse = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', oldCookie)
      .expect(409);
    expect(reuse.body.error.code).toBe('REFRESH_TOKEN_REUSE_DETECTED');
    expect(String(reuse.headers['set-cookie'])).toContain('ml_refresh=;');
    expect(await AuthSessionModel.countDocuments({ status: { $ne: 'REVOKED' } })).toBe(0);

    await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${refreshed.body.data.accessToken}`)
      .expect(401);
  });

  it('requires an approved origin and logs out idempotently', async () => {
    await request(app).post('/api/v1/auth/register').send(registration).expect(201);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registration.email, password: registration.password })
      .expect(200);
    const cookie = getCookie(login);

    const forbidden = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Origin', 'https://attacker.example')
      .set('Cookie', cookie)
      .expect(403);
    expect(forbidden.body.error.code).toBe('ORIGIN_NOT_ALLOWED');

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', cookie)
      .expect(204);
    expect(String(logout.headers['set-cookie'])).toContain('ml_refresh=;');
    expect(await AuthSessionModel.countDocuments({ status: 'REVOKED' })).toBe(1);

    await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .expect(204);
  });

  it('enforces identity cooldown after five failed credential attempts', async () => {
    await request(app).post('/api/v1/auth/register').send(registration).expect(201);
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: registration.email, password: 'WrongPassword123!' })
        .expect(401);
    }
    const locked = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: registration.email, password: registration.password })
      .expect(429);
    expect(locked.body.error.code).toBe('RATE_LIMITED');
  });
});
