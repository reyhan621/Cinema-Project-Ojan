const request = require("supertest");
const app = require("../src/app");
const db = require("./helpers/db");

beforeAll(async () => {
  await db.connect();
});
afterEach(async () => {
  await db.clear();
});
afterAll(async () => {
  await db.close();
});

const creds = { name: "V", email: "v@x.com", password: "secret123", confirmPassword: "secret123" };

test("register returns 201 with a devCode and an unverified account", async () => {
  const res = await request(app).post("/api/auth/register").send(creds);
  expect(res.status).toBe(201);
  expect(res.body.devCode).toMatch(/^\d{6}$/);
});

test("login before verification → 403 with EMAIL_NOT_VERIFIED code", async () => {
  await request(app).post("/api/auth/register").send(creds);
  const res = await request(app).post("/api/auth/login").send({ email: creds.email, password: creds.password });
  expect(res.status).toBe(403);
  // Machine-readable code lets the client route the user to re-verify instead of
  // showing a misleading "invalid credentials" message.
  expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
});

test("wrong code → 400; correct code verifies and enables login", async () => {
  const reg = await request(app).post("/api/auth/register").send(creds);
  const bad = await request(app).post("/api/auth/verify-email").send({ email: creds.email, code: "000000" });
  expect(bad.status).toBe(400);
  const ok = await request(app).post("/api/auth/verify-email").send({ email: creds.email, code: reg.body.devCode });
  expect(ok.status).toBe(200);
  const login = await request(app).post("/api/auth/login").send({ email: creds.email, password: creds.password });
  expect(login.status).toBe(200);
});

test("resend-verification returns a generic 200", async () => {
  await request(app).post("/api/auth/register").send(creds);
  const res = await request(app).post("/api/auth/resend-verification").send({ email: creds.email });
  expect(res.status).toBe(200);
});
