const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const bcrypt = require("bcrypt");
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

// Verified user created directly (the verification flow is added in the next task).
const makeUser = async () => {
  await User.create({
    name: "R",
    email: "r@x.com",
    password: await bcrypt.hash("secret123", 10),
    role: "user",
    isVerified: true,
  });
  const res = await request(app).post("/api/auth/login").send({ email: "r@x.com", password: "secret123" });
  return res.headers["set-cookie"];
};

const cookieNamed = (cookies, name) => (cookies || []).find((c) => c.startsWith(name + "="));

test("login sets both access and refresh cookies", async () => {
  const cookies = await makeUser();
  expect(cookieNamed(cookies, "token")).toBeDefined();
  expect(cookieNamed(cookies, "refreshToken")).toBeDefined();
});

test("refresh rotates tokens", async () => {
  const cookies = await makeUser();
  const refresh = cookieNamed(cookies, "refreshToken");
  const res = await request(app).post("/api/auth/refresh").set("Cookie", refresh);
  expect(res.status).toBe(200);
  expect(cookieNamed(res.headers["set-cookie"], "token")).toBeDefined();
});

test("reusing a rotated-out refresh token is detected and revoked", async () => {
  const cookies = await makeUser();
  const oldRefresh = cookieNamed(cookies, "refreshToken");
  await request(app).post("/api/auth/refresh").set("Cookie", oldRefresh); // rotates it
  const reuse = await request(app).post("/api/auth/refresh").set("Cookie", oldRefresh); // now stale
  expect(reuse.status).toBe(401);
});
