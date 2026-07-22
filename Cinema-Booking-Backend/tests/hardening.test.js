const request = require("supertest");
const app = require("../src/app");
const db = require("./helpers/db");
const { buildAuthCookieOptions } = require("../src/utils/cookies");

beforeAll(async () => {
  await db.connect();
});
afterEach(async () => {
  await db.clear();
});
afterAll(async () => {
  await db.close();
});

test("cookie is secure only in production", () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  expect(buildAuthCookieOptions().secure).toBe(true);
  process.env.NODE_ENV = "test";
  expect(buildAuthCookieOptions().secure).toBe(false);
  process.env.NODE_ENV = prev;
});

test("helmet security header present", async () => {
  const res = await request(app).get("/");
  expect(res.headers["x-content-type-options"]).toBe("nosniff");
});

test("unknown user and wrong password return the same 401 shape", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ name: "C", email: "c@x.com", password: "secret123", confirmPassword: "secret123" });
  const wrong = await request(app)
    .post("/api/auth/login")
    .send({ email: "c@x.com", password: "bad" });
  const ghost = await request(app)
    .post("/api/auth/login")
    .send({ email: "ghost@x.com", password: "bad" });
  expect(wrong.status).toBe(401);
  expect(ghost.status).toBe(401);
  expect(ghost.body.message).toBe(wrong.body.message);
});
