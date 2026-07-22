const request = require("supertest");
const app = require("../../src/app");

// Register a user and immediately verify their email using the non-production
// `devCode` returned by /register, so downstream tests get a login-ready account.
const registerVerified = async (over = {}) => {
  const creds = {
    name: "U",
    email: `u_${Math.random().toString(36).slice(2)}@x.com`,
    password: "secret123",
    confirmPassword: "secret123",
    ...over,
  };
  const reg = await request(app).post("/api/auth/register").send(creds);
  await request(app)
    .post("/api/auth/verify-email")
    .send({ email: creds.email, code: reg.body.devCode });
  return creds;
};

const cookieFor = async (over = {}) => {
  const creds = await registerVerified(over);
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: creds.email, password: creds.password });
  return res.headers["set-cookie"];
};

module.exports = { registerVerified, cookieFor };
