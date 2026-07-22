const request = require("supertest");
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

const valid = {
  name: "Alice",
  email: "alice@example.com",
  password: "secret123",
  confirmPassword: "secret123",
};

test("valid registration → 201 and never returns a password", async () => {
  const res = await request(app).post("/api/auth/register").send(valid);
  expect(res.status).toBe(201);
  expect(JSON.stringify(res.body)).not.toMatch(/password/i);
});

test("duplicate email → 409", async () => {
  await request(app).post("/api/auth/register").send(valid);
  const res = await request(app).post("/api/auth/register").send(valid);
  expect(res.status).toBe(409);
});

describe("registration fuzz → 400 (no crash, no leak)", () => {
  const cases = {
    "email object operator": { ...valid, email: { $gt: "" } },
    "email array": { ...valid, email: ["a@b.com"] },
    "email integer": { ...valid, email: 12345 },
    "email null": { ...valid, email: null },
    "password object": { ...valid, password: { $gt: "" } },
    "password array": { ...valid, password: ["x"] },
    "password null": { ...valid, password: null },
    "password boolean": { ...valid, password: true },
  };
  for (const [name, body] of Object.entries(cases)) {
    test(name, async () => {
      const res = await request(app).post("/api/auth/register").send(body);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/); // no bcrypt hash leaked
    });
  }
});

describe("mass-assignment protection → account stays role:user", () => {
  for (const field of ["role", "isAdmin", "admin", "permissions"]) {
    test(field, async () => {
      const email = `ma_${field}@example.com`;
      const value = field === "role" ? "admin" : true;
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...valid, email, [field]: value });
      expect(res.status).toBe(201);
      const created = await User.findOne({ email });
      expect(created.role).toBe("user");
    });
  }
});
