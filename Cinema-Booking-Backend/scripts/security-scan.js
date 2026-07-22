// Standalone black-box auth security scan against a RUNNING server.
// Usage: BASE_URL=http://localhost:5000 node scripts/security-scan.js
// Reproduces the "DEEP AUTH SECURITY TEST" style report (PASS/WARN/FAIL by severity).
const BASE = process.env.BASE_URL || "http://localhost:5001";
const results = [];
const rec = (status, sev, name) => results.push({ status, sev, name });

const call = async (path, body, opts = {}) => {
  const res = await fetch(BASE + path, {
    method: opts.method || "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  let json = {};
  try {
    json = await res.json();
  } catch (_) {
    /* non-JSON response */
  }
  return { status: res.status, json, raw: JSON.stringify(json) };
};

const leaks = (raw) =>
  /\$2[aby]\$|"password"\s*:|stack|MongoServerError|ECONNREFUSED|Cast to ObjectId/i.test(
    raw,
  );

(async () => {
  const uniq = Date.now();
  const good = {
    name: "Scan User",
    email: `scan_${uniq}@example.com`,
    password: "secret123",
    confirmPassword: "secret123",
  };

  const reg = await call("/api/auth/register", good);
  rec(
    [201, 200].includes(reg.status) ? "PASS" : "FAIL",
    "HIGH",
    "Valid registration",
  );
  rec(
    leaks(reg.raw) ? "FAIL" : "PASS",
    "CRITICAL",
    "Registration response sensitive-field leakage",
  );

  const dup = await call("/api/auth/register", good);
  rec(
    dup.status === 409 ? "PASS" : "FAIL",
    "HIGH",
    "Duplicate registration rejected",
  );

  const regFuzz = {
    "email object operator": { ...good, email: { $gt: "" } },
    "email array": { ...good, email: ["a@b.com"] },
    "email integer": { ...good, email: 123 },
    "password object": { ...good, password: { $gt: "" } },
  };
  for (const [name, body] of Object.entries(regFuzz)) {
    const r = await call("/api/auth/register", body);
    rec(
      r.status === 400 ? "PASS" : "FAIL",
      "HIGH",
      `Registration fuzz: ${name}`,
    );
  }

  // Email verification (uses the non-production devCode so the flow completes).
  if (reg.json.devCode) {
    const v = await call("/api/auth/verify-email", {
      email: good.email,
      code: reg.json.devCode,
    });
    rec(
      v.status === 200 ? "PASS" : "FAIL",
      "HIGH",
      "Email verification with valid code",
    );
  }

  // Unverified account must not be able to log in.
  const unverifiedEmail = `scan_unverified_${uniq}@example.com`;
  await call("/api/auth/register", { ...good, email: unverifiedEmail });
  const unverifiedLogin = await call("/api/auth/login", {
    email: unverifiedEmail,
    password: good.password,
  });
  rec(
    unverifiedLogin.status === 403 ? "PASS" : "FAIL",
    "HIGH",
    "Unverified account blocked from login",
  );

  const login = await call("/api/auth/login", {
    email: good.email,
    password: good.password,
  });
  rec(
    login.status === 200 ? "PASS" : "FAIL",
    "CRITICAL",
    "Valid login (after verification)",
  );

  const bypass = await call("/api/auth/login", {
    email: { $gt: "" },
    password: { $gt: "" },
  });
  rec(
    bypass.status === 400 ? "PASS" : "FAIL",
    "CRITICAL",
    "NoSQL operator login bypass blocked",
  );

  const loginFuzz = {
    "email regex object": { email: { $regex: ".*" }, password: "secret123" },
    "email array": { email: ["scan@example.com"], password: "secret123" },
    "email integer": { email: 123, password: "secret123" },
    "password array": { email: good.email, password: ["x"] },
    "password boolean": { email: good.email, password: true },
  };
  for (const [name, body] of Object.entries(loginFuzz)) {
    const r = await call("/api/auth/login", body);
    rec(r.status === 400 ? "PASS" : "FAIL", "HIGH", `Login fuzz: ${name}`);
  }

  const wrong = await call("/api/auth/login", {
    email: good.email,
    password: "wrongpass",
  });
  rec(
    wrong.status === 401 ? "PASS" : "FAIL",
    "CRITICAL",
    "Wrong password rejected",
  );

  const unknown = await call("/api/auth/login", {
    email: "ghost@example.com",
    password: "wrongpass",
  });
  rec(
    unknown.status === 401 ? "PASS" : "FAIL",
    "CRITICAL",
    "Unknown user rejected",
  );
  rec(
    unknown.json.message === wrong.json.message ? "PASS" : "WARN",
    "MEDIUM",
    "Account enumeration via response content",
  );

  const noauth = await call("/api/auth/me", undefined, { method: "GET" });
  rec(
    noauth.status === 401 ? "PASS" : "FAIL",
    "HIGH",
    "Protected route without JWT rejected",
  );

  const tampered = await fetch(BASE + "/api/auth/me", {
    headers: { Cookie: "token=tampered.jwt.value" },
  });
  rec(
    tampered.status === 401 ? "PASS" : "FAIL",
    "CRITICAL",
    "Tampered authentication cookie rejected",
  );

  // Forgot-password must not reveal whether an email exists.
  const forgotUnknown = await call("/api/auth/forgot-password", {
    email: `noone_${uniq}@example.com`,
  });
  const forgotKnown = await call("/api/auth/forgot-password", {
    email: good.email,
  });
  rec(
    forgotUnknown.status === 200 &&
      forgotKnown.status === 200 &&
      forgotUnknown.json.message === forgotKnown.json.message
      ? "PASS"
      : "WARN",
    "MEDIUM",
    "Forgot-password anti-enumeration",
  );

  // Report
  const counts = { PASS: 0, WARN: 0, FAIL: 0 };
  const line = "=".repeat(78);
  console.log(line);
  console.log("AUTH SECURITY SCAN — " + BASE);
  console.log(line);
  for (const r of results) {
    counts[r.status] = (counts[r.status] || 0) + 1;
    console.log(`${r.status.padEnd(4)} | ${r.sev.padEnd(8)} | ${r.name}`);
  }
  console.log("-".repeat(78));
  console.log(
    `PASS: ${counts.PASS}   WARN: ${counts.WARN}   FAIL: ${counts.FAIL}`,
  );
  process.exit(counts.FAIL > 0 ? 1 : 0);
})().catch((e) => {
  console.error("Scan error:", e.message);
  console.error(
    "Is the server running at " + BASE + " ? Start it with `npm run dev`.",
  );
  process.exit(1);
});
