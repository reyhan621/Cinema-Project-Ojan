const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../src/app");
const db = require("./helpers/db");
const { cookieFor } = require("./helpers/auth");
const User = require("../src/models/User");
const Movie = require("../src/models/Movie");
const Cinema = require("../src/models/Cinema");
const Hall = require("../src/models/Hall");
const Showtime = require("../src/models/Showtime");

beforeAll(async () => {
  await db.connect();
});
afterEach(async () => {
  await db.clear();
});
afterAll(async () => {
  await db.close();
});

// Admin auth cookie (the create/update/delete showtime routes require admin).
const adminCookie = async () => {
  await User.create({
    name: "Admin",
    email: "admin@x.com",
    password: await bcrypt.hash("admin123", 10),
    role: "admin",
    isVerified: true,
  });
  const res = await request(app).post("/api/auth/login").send({ email: "admin@x.com", password: "admin123" });
  return res.headers["set-cookie"];
};

const makeRefs = async () => {
  const movie = await Movie.create({
    title: "M", genre: ["Action"], duration: 120, rating: "PG-13", poster: "p.jpg", description: "d",
  });
  const cinema = await Cinema.create({ name: "Test Cinema", city: "Testville" });
  const hall = await Hall.create({ cinema: cinema._id, name: "Studio 1", rows: 8, columns: 10, totalSeats: 80 });
  return { movie, cinema, hall };
};

const future = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

test("admin creates a showtime → 201 with populated movie/cinema/hall", async () => {
  const cookie = await adminCookie();
  const { movie, cinema, hall } = await makeRefs();

  const res = await request(app)
    .post("/api/showtimes")
    .set("Cookie", cookie)
    .send({ movieId: movie._id, cinema: cinema._id, hall: hall._id, date: future(), time: "13:00", endTime: "16:00", price: 50000 });

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  // Regression: the create handler must return the fully populated document.
  // Document.populate() chaining threw a 500 ("...populate is not a function")
  // under Mongoose 9 — it must be a single populate([...]) call.
  expect(res.body.data.movieId).toBeTruthy();
  expect(res.body.data.cinema).toBeTruthy();
  expect(res.body.data.hall).toBeTruthy();
  expect(res.body.data.studio).toBe("Studio 1");
});

test("schedule conflict in the same hall/date → 400", async () => {
  const cookie = await adminCookie();
  const { movie, cinema, hall } = await makeRefs();
  const base = { movieId: movie._id, cinema: cinema._id, hall: hall._id, date: future(), price: 50000 };

  const a = await request(app).post("/api/showtimes").set("Cookie", cookie).send({ ...base, time: "13:00", endTime: "16:00" });
  expect(a.status).toBe(201);

  const b = await request(app).post("/api/showtimes").set("Cookie", cookie).send({ ...base, time: "14:00", endTime: "17:00" });
  expect(b.status).toBe(400);
});

test("creating a showtime as a normal user → 403", async () => {
  const userCookie = await cookieFor();
  const { movie, cinema, hall } = await makeRefs();

  const res = await request(app)
    .post("/api/showtimes")
    .set("Cookie", userCookie)
    .send({ movieId: movie._id, cinema: cinema._id, hall: hall._id, date: future(), time: "13:00", endTime: "16:00", price: 50000 });

  expect(res.status).toBe(403);
});

test("upcoming=true returns only future showtimes for the movie", async () => {
  const { movie, cinema, hall } = await makeRefs();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  await Showtime.create([
    {
      movieId: movie._id,
      cinema: cinema._id,
      hall: hall._id,
      date: yesterday,
      time: "13:00",
      endTime: "16:00",
      studio: hall.name,
      price: 50000,
    },
    {
      movieId: movie._id,
      cinema: cinema._id,
      hall: hall._id,
      date: tomorrow,
      time: "13:00",
      endTime: "16:00",
      studio: hall.name,
      price: 50000,
    },
  ]);

  const res = await request(app).get(`/api/showtimes?movieId=${movie._id}&upcoming=true`);
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data).toHaveLength(1);
  expect(res.body.data[0].date.slice(0, 10)).toBe(tomorrow.toISOString().slice(0, 10));
});

test("invalid upcoming query value returns 400", async () => {
  const res = await request(app).get("/api/showtimes?upcoming=yes");
  expect(res.status).toBe(400);
});
