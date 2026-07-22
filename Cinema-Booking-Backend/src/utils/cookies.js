const prod = () => process.env.NODE_ENV === "production";
const ACCESS_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Kept for the hardening test (asserts `secure` follows the environment).
const buildAuthCookieOptions = () => ({
  httpOnly: true,
  secure: prod(),
  sameSite: "lax",
  maxAge: REFRESH_MS,
});

// Access cookie is sent on every request; refresh cookie is scoped to the
// refresh endpoint so it is not exposed to the rest of the API surface.
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: prod(),
    sameSite: "lax",
    maxAge: ACCESS_MS,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: prod(),
    sameSite: "lax",
    maxAge: REFRESH_MS,
    path: "/api/auth/refresh",
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("token", { httpOnly: true, secure: prod(), sameSite: "lax" });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: prod(),
    sameSite: "lax",
    path: "/api/auth/refresh",
  });
};

module.exports = { buildAuthCookieOptions, setAuthCookies, clearAuthCookies };
