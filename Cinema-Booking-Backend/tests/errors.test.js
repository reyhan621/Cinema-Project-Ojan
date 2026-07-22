const request = require("supertest");
const app = require("../src/app");
const db = require("./helpers/db");

beforeAll(async () => {
  await db.connect();
});
afterAll(async () => {
  await db.close();
});

test("unknown route → 404 JSON", async () => {
  const res = await request(app).get("/api/nope");
  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
});

test("bad ObjectId → 400 without leaking Mongoose internals", async () => {
  const res = await request(app).get("/api/movies/not-a-valid-id");
  expect(res.status).toBe(400);
  expect(res.body.message).not.toMatch(/Cast to ObjectId|ObjectId|stack/i);
});
