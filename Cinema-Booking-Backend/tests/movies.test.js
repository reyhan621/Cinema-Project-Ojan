const request = require("supertest");
const app = require("../src/app");
const Movie = require("../src/models/Movie");
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

const seedMovies = () =>
  Movie.create([
    { title: "Avengers", genre: "Action", duration: 143, rating: "PG-13", poster: "a.jpg", description: "d" },
    { title: "Avengers Endgame", genre: "Action", duration: 181, rating: "PG-13", poster: "b.jpg", description: "d" },
    { title: "Dune", genre: "Sci-Fi", duration: 155, rating: "PG-13", poster: "c.jpg", description: "d" },
  ]);

test("case-insensitive title search", async () => {
  await seedMovies();
  const res = await request(app).get("/api/movies?search=aveng");
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(2);
});

test("genre filter", async () => {
  await seedMovies();
  const res = await request(app).get("/api/movies?genre=sci-fi");
  expect(res.body.data).toHaveLength(1);
  expect(res.body.data[0].title).toBe("Dune");
});

test("pagination metadata", async () => {
  await seedMovies();
  const res = await request(app).get("/api/movies?page=1&limit=2");
  expect(res.body.data).toHaveLength(2);
  expect(res.body.totalItems).toBe(3);
  expect(res.body.totalPages).toBe(2);
  expect(res.body.page).toBe(1);
});

test("regex metacharacters in search are treated literally (no ReDoS/injection)", async () => {
  await seedMovies();
  const res = await request(app).get("/api/movies?search=" + encodeURIComponent(".*"));
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(0);
});
