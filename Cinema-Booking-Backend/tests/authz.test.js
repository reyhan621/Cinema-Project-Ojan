const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../src/app");
const User = require("../src/models/User");
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

const { cookieFor } = require("./helpers/auth");
const userCookie = () => cookieFor();

const adminCookie = async () => {
  await User.create({
    name: "Admin",
    email: "admin@x.com",
    password: await bcrypt.hash("secret123", 10),
    role: "admin",
    isVerified: true,
  });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@x.com", password: "secret123" });
  return res.headers["set-cookie"];
};

test("protected route without JWT → 401", async () => {
  const res = await request(app).get("/api/auth/me");
  expect(res.status).toBe(401);
});

test("normal user → admin API → 403", async () => {
  const cookie = await userCookie();
  const res = await request(app).get("/api/admin/stats").set("Cookie", cookie);
  expect(res.status).toBe(403);
});

test("admin → admin API → 200", async () => {
  const cookie = await adminCookie();
  const res = await request(app).get("/api/admin/stats").set("Cookie", cookie);
  expect(res.status).toBe(200);
});
