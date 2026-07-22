const rateLimit = require("express-rate-limit");

// Disabled under NODE_ENV=test so the auth test suite (which logs in many times)
// stays deterministic; active in dev/production.
const isTest = process.env.NODE_ENV === "test";
const passthrough = (req, res, next) => next();

const loginLimiter = isTest
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 10, // per IP per window
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: "Too many attempts, please try again later." },
    });

// Shared limiter for the code-based flows (verify, resend, forgot, reset).
const authLimiter = isTest
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: "Too many attempts, please try again later." },
    });

module.exports = { loginLimiter, authLimiter };
