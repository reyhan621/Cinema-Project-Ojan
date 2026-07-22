const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Distinct secrets for access vs refresh (fall back to JWT_SECRET during migration).
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || "7d";

const signAccessToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, role: user.role, tokenVersion: user.tokenVersion || 0 },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion || 0, jti: crypto.randomUUID() },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

// Stored server-side to detect refresh-token reuse (the token itself is high-entropy,
// so a plain sha256 is sufficient and fast).
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
