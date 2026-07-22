const request = require("supertest");
const app = require("../src/app");
const Movie = require("../src/models/Movie");
const Showtime = require("../src/models/Showtime");
const Cinema = require("../src/models/Cinema");
const Hall = require("../src/models/Hall");
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

const makeShowtimes = async () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const movie = await Movie.create({
    title: "T",
    genre: ["Action"],
    duration: 120,
    rating: "PG-13",
    poster: "p.jpg",
    description: "d",
  });
  const cinema = await Cinema.create({ name: "Test Cinema", city: "Testville" });
  const hall = await Hall.create({ cinema: cinema._id, name: "Studio 1", rows: 8, columns: 10, totalSeats: 80 });
  const base = { movieId: movie._id, cinema: cinema._id, hall: hall._id, studio: hall.name, date: future };
  const st1 = await Showtime.create({ ...base, time: "13:00", endTime: "15:00", price: 50 });
  const st2 = await Showtime.create({ ...base, time: "16:00", endTime: "18:00", price: 50 });
  return { st1, st2 };
};

const book = (cookie, showtimeId, seats) =>
  request(app).post("/api/bookings").set("Cookie", cookie).send({ showtimeId, seats });

test("duplicate seat/showtime → 409; same seat different showtime → 201", async () => {
  const { st1, st2 } = await makeShowtimes();
  const u1 = await userCookie();
  const u2 = await userCookie();

  const a = await book(u1, st1._id.toString(), ["A1"]);
  expect(a.status).toBe(201);

  const b = await book(u2, st1._id.toString(), ["A1"]);
  expect(b.status).toBe(409);
  expect(b.body.unavailableSeats).toContain("A1");

  const c = await book(u2, st2._id.toString(), ["A1"]);
  expect(c.status).toBe(201);
});

test("cancel releases the seats", async () => {
  const { st1 } = await makeShowtimes();
  const u1 = await userCookie();
  const created = await book(u1, st1._id.toString(), ["B2"]);
  const del = await request(app)
    .delete(`/api/bookings/${created.body.data._id}`)
    .set("Cookie", u1);
  expect(del.status).toBe(200);
  const seats = await request(app).get(`/api/showtimes/${st1._id}/seats`);
  expect(seats.body.data.bookedSeats).not.toContain("B2");
});

test("non-owner cannot read another user's booking → 403", async () => {
  const { st1 } = await makeShowtimes();
  const u1 = await userCookie();
  const u2 = await userCookie();
  const created = await book(u1, st1._id.toString(), ["C3"]);
  const res = await request(app)
    .get(`/api/bookings/${created.body.data._id}`)
    .set("Cookie", u2);
  expect(res.status).toBe(403);
});

test("race: two users book the same seat at once → exactly one 201, one 409", async () => {
  const { st1 } = await makeShowtimes();
  const u1 = await userCookie();
  const u2 = await userCookie();

  // Fire both requests concurrently so they race for seat A1. The atomic
  // findOneAndUpdate CAS in the controller guarantees only one can win.
  const [r1, r2] = await Promise.all([
    book(u1, st1._id.toString(), ["A1"]),
    book(u2, st1._id.toString(), ["A1"]),
  ]);
  expect([r1.status, r2.status].sort()).toEqual([201, 409]);

  // The seat is stored exactly once — no double reservation slipped through.
  const seats = await request(app).get(`/api/showtimes/${st1._id}/seats`);
  const bookedA1 = seats.body.data.bookedSeats.filter((s) => s === "A1");
  expect(bookedA1).toHaveLength(1);
});

test("cannot book a showtime whose start time has already passed → 400", async () => {
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
  const movie = await Movie.create({
    title: "Past", genre: ["Action"], duration: 120, rating: "PG-13", poster: "p.jpg", description: "d",
  });
  const cinema = await Cinema.create({ name: "Past Cinema", city: "Testville" });
  const hall = await Hall.create({ cinema: cinema._id, name: "Studio 1", rows: 8, columns: 10, totalSeats: 80 });
  const showtime = await Showtime.create({
    movieId: movie._id, cinema: cinema._id, hall: hall._id, studio: hall.name,
    date: past, time: "13:00", endTime: "15:00", price: 50,
  });

  const u1 = await userCookie();
  const res = await book(u1, showtime._id.toString(), ["A1"]);
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/past/i);
});

test("owner reads their booking → 200 with populated user/movie/showtime", async () => {
  const { st1 } = await makeShowtimes();
  const u1 = await userCookie();

  const created = await book(u1, st1._id.toString(), ["A1"]);
  expect(created.status).toBe(201);
  // The created booking must come back fully populated (userId was an ObjectId before).
  expect(created.body.data.userId).toHaveProperty("email");
  expect(created.body.data.movieId).toHaveProperty("title");

  const res = await request(app)
    .get(`/api/bookings/${created.body.data._id}`)
    .set("Cookie", u1);
  expect(res.status).toBe(200);
  // Populated userId is what the ticket page needs for the owner check + customer display.
  expect(res.body.data.userId).toHaveProperty("email");
  expect(res.body.data.movieId).toHaveProperty("title");
  expect(res.body.data.showtimeId).toHaveProperty("hall");
});
