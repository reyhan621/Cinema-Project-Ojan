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

const creds = {
  name: "Bob",
  email: "bob@example.com",
  password: "secret123",
  confirmPassword: "secret123",
};
const registerBob = async () => {
  const reg = await request(app).post("/api/auth/register").send(creds);
  await request(app)
    .post("/api/auth/verify-email")
    .send({ email: creds.email, code: reg.body.devCode });
};

test("valid login → 200 with auth cookie", async () => {
  await registerBob();
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: creds.email, password: creds.password });
  expect(res.status).toBe(200);
  expect((res.headers["set-cookie"] || []).join(";")).toMatch(/token=/);
});

test("wrong password → 401", async () => {
  await registerBob();
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: creds.email, password: "nope" });
  expect(res.status).toBe(401);
});

test("unknown user → 401", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "ghost@example.com", password: "secret123" });
  expect(res.status).toBe(401);
});

describe("login fuzz → 400 (NoSQL operators must not bypass auth)", () => {
  const cases = {
    "email operator object": { email: { $gt: "" }, password: "secret123" },
    "email regex object": { email: { $regex: ".*" }, password: "secret123" },
    "email array": { email: ["bob@example.com"], password: "secret123" },
    "email integer": { email: 123, password: "secret123" },
    "password object": { email: "bob@example.com", password: { $gt: "" } },
    "password array": { email: "bob@example.com", password: ["x"] },
    "password boolean": { email: "bob@example.com", password: true },
  };
  for (const [name, body] of Object.entries(cases)) {
    test(name, async () => {
      await registerBob();
      const res = await request(app).post("/api/auth/login").send(body);
      expect(res.status).toBe(400);
    });
  }
});
