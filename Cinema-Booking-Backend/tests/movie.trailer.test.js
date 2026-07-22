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

const movieBody = (over = {}) => ({
  title: "Dune",
  genre: "Sci-Fi",
  duration: 155,
  rating: "PG-13",
  poster: "dune.jpg",
  description: "A desert planet.",
  ...over,
});

test("trailerUrl is saved on create and returned by the API", async () => {
  const cookie = await adminCookie();
  const trailerUrl = "https://www.youtube.com/watch?v=abc123XYZ";

  const created = await request(app)
    .post("/api/movies")
    .set("Cookie", cookie)
    .send(movieBody({ trailerUrl }));
  expect(created.status).toBe(201);
  expect(created.body.data.trailerUrl).toBe(trailerUrl);

  const fetched = await request(app).get(`/api/movies/${created.body.data._id}`);
  expect(fetched.status).toBe(200);
  expect(fetched.body.data.trailerUrl).toBe(trailerUrl);
});

test("a movie without a trailer still works (trailerUrl is optional)", async () => {
  const cookie = await adminCookie();
  const created = await request(app).post("/api/movies").set("Cookie", cookie).send(movieBody());
  expect(created.status).toBe(201);
  // A movie with no trailer stores an empty string (or nothing) — both are "no trailer".
  expect(created.body.data.trailerUrl || "").toBe("");
});

test("trailerUrl can be updated", async () => {
  const cookie = await adminCookie();
  const created = await request(app).post("/api/movies").set("Cookie", cookie).send(movieBody());
  const updated = await request(app)
    .put(`/api/movies/${created.body.data._id}`)
    .set("Cookie", cookie)
    .send({ trailerUrl: "https://youtu.be/xyz789" });
  expect(updated.status).toBe(200);
  expect(updated.body.data.trailerUrl).toBe("https://youtu.be/xyz789");
});
