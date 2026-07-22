/**
 * Migration script: Links legacy halls and showtimes to cinemas.
 *
 * What it does:
 *  1. Ensures at least one Cinema exists (creates "Default Cinema" in "Jakarta" if none).
 *  2. Links any Hall without a `cinema` ref to that Cinema.
 *  3. Sets `rows` and `columns` on Halls that are missing them (defaults: 8×10 → 80 seats).
 *  4. Links any Showtime without a `cinema`/`hall` ref by matching `studio` to an existing Hall name.
 *
 * Run:  node scripts/migrate-legacy-data.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Cinema = require("../src/models/Cinema");
const Hall = require("../src/models/Hall");
const Showtime = require("../src/models/Showtime");

async function run() {
  console.log("⏳ Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected\n");

  // ── 1. Ensure at least one Cinema ──────────────────────────────────────
  let legacyCinema = await Cinema.findOne();
  if (!legacyCinema) {
    legacyCinema = await Cinema.create({ name: "Default Cinema", city: "Jakarta" });
    console.log("🎬 Created default Cinema:", legacyCinema.name, legacyCinema._id);
  } else {
    console.log("🎬 Using existing Cinema:", legacyCinema.name, legacyCinema._id);
  }

  // ── 2. Link orphaned Halls ─────────────────────────────────────────────
  const orphanHalls = await Hall.find({ $or: [{ cinema: { $exists: false } }, { cinema: null }] });
  console.log(`\n🏢 Found ${orphanHalls.length} halls without a cinema ref`);

  for (const hall of orphanHalls) {
    // Set default rows/columns if missing
    if (!hall.rows || !hall.columns) {
      hall.rows = hall.rows || 8;
      hall.columns = hall.columns || 10;
      hall.totalSeats = hall.rows * hall.columns;
    }
    hall.cinema = legacyCinema._id;
    await hall.save();
    console.log(`  ✔ Hall "${hall.name}" → linked to "${legacyCinema.name}" (${hall.rows}×${hall.columns}=${hall.totalSeats} seats)`);
  }

  // ── 3. Link orphaned Showtimes ────────────────────────────────────────
  const orphanShowtimes = await Showtime.find({
    $or: [
      { cinema: { $exists: false } },
      { cinema: null },
      { hall: { $exists: false } },
      { hall: null },
    ],
  }).populate("hall");
  console.log(`\n🎞️  Found ${orphanShowtimes.length} showtimes without cinema/hall refs`);

  // Build a lookup of hall name → Hall doc for this cinema
  const hallDocs = await Hall.find({ cinema: legacyCinema._id });
  const hallByName = {};
  for (const h of hallDocs) {
    hallByName[h.name] = h;
  }

  for (const st of orphanShowtimes) {
    // Try to match the `studio` string to an existing Hall name
    let matchedHall = hallByName[st.studio];

    if (!matchedHall) {
      // Create a new Hall for this studio name
      matchedHall = await Hall.create({
        cinema: legacyCinema._id,
        name: st.studio || "Studio 1",
        rows: 8,
        columns: 10,
        totalSeats: 80,
      });
      hallByName[matchedHall.name] = matchedHall;
      console.log(`  ➕ Created Hall "${matchedHall.name}" for orphan showtime`);
    }

    st.cinema = legacyCinema._id;
    st.hall = matchedHall._id;

    // Ensure endTime exists (default: 2h after start)
    if (!st.endTime) {
      st.endTime = st.time; // fallback; can't compute precisely without parsing
    }

    await st.save();
    console.log(`  ✔ Showtime ${st._id} (studio "${st.studio}") → cinema "${legacyCinema.name}", hall "${matchedHall.name}"`);
  }

  console.log("\n✅ Migration complete.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
