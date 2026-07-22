const request = require("supertest");
const app = require("../src/app");
const db = require("./helpers/db");

beforeAll(async () => {
  await db.connect();
});
afterAll(async () => {
  await db.close();
});

test("GET / reports API running", async () => {
  const res = await request(app).get("/");
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});
