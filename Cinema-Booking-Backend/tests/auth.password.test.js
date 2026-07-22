const request = require("supertest");
const app = require("../src/app");
const db = require("./helpers/db");
const { registerVerified, cookieFor } = require("./helpers/auth");

beforeAll(async () => {
  await db.connect();
});
afterEach(async () => {
  await db.clear();
});
afterAll(async () => {
  await db.close();
});

test("forgot-password returns a generic 200 for an unknown email (no enumeration)", async () => {
  const res = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@x.com" });
  expect(res.status).toBe(200);
  expect(res.body.devCode).toBeUndefined();
});

test("reset-password: wrong code → 400; correct code resets and enables new login", async () => {
  const creds = await registerVerified({ email: "reset@x.com" });
  const forgot = await request(app).post("/api/auth/forgot-password").send({ email: creds.email });
  expect(forgot.body.devCode).toMatch(/^\d{6}$/);

  const bad = await request(app)
    .post("/api/auth/reset-password")
    .send({ email: creds.email, code: "000000", newPassword: "newpass123", confirmPassword: "newpass123" });
  expect(bad.status).toBe(400);

  const ok = await request(app)
    .post("/api/auth/reset-password")
    .send({ email: creds.email, code: forgot.body.devCode, newPassword: "newpass123", confirmPassword: "newpass123" });
  expect(ok.status).toBe(200);

  const oldLogin = await request(app).post("/api/auth/login").send({ email: creds.email, password: creds.password });
  expect(oldLogin.status).toBe(401);
  const newLogin = await request(app).post("/api/auth/login").send({ email: creds.email, password: "newpass123" });
  expect(newLogin.status).toBe(200);
});

test("change-password: wrong current → 400; correct rotates the password", async () => {
  const cookies = await cookieFor({ email: "chg@x.com" });
  const bad = await request(app)
    .post("/api/auth/change-password")
    .set("Cookie", cookies)
    .send({ currentPassword: "wrong", newPassword: "newpass123", confirmPassword: "newpass123" });
  expect(bad.status).toBe(400);

  const ok = await request(app)
    .post("/api/auth/change-password")
    .set("Cookie", cookies)
    .send({ currentPassword: "secret123", newPassword: "newpass123", confirmPassword: "newpass123" });
  expect(ok.status).toBe(200);

  const newLogin = await request(app).post("/api/auth/login").send({ email: "chg@x.com", password: "newpass123" });
  expect(newLogin.status).toBe(200);
});

test("unverified account: a password reset verifies it and enables login", async () => {
  // Register WITHOUT verifying — simulates a user who closed the verify-email tab.
  const email = "stuck@x.com";
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Stuck", email, password: "secret123", confirmPassword: "secret123" });

  // Login is blocked while unverified (with the machine-readable code).
  const blocked = await request(app).post("/api/auth/login").send({ email, password: "secret123" });
  expect(blocked.status).toBe(403);
  expect(blocked.body.code).toBe("EMAIL_NOT_VERIFIED");

  // Recover via forgot-password → reset-password.
  const forgot = await request(app).post("/api/auth/forgot-password").send({ email });
  expect(forgot.body.devCode).toMatch(/^\d{6}$/);
  const reset = await request(app)
    .post("/api/auth/reset-password")
    .send({ email, code: forgot.body.devCode, newPassword: "newpass123", confirmPassword: "newpass123" });
  expect(reset.status).toBe(200);

  // The reset proved inbox ownership, so the account is now verified → login works.
  const login = await request(app).post("/api/auth/login").send({ email, password: "newpass123" });
  expect(login.status).toBe(200);
});
