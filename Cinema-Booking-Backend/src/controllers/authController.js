const authService = require("../services/authService");
const emailService = require("../services/emailService");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const { verifyRefreshToken, hashToken } = require("../utils/tokens");

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });

// Fields safe to expose via /me — excludes password, code hashes, and token state.
const SAFE_FIELDS = "-password -verification -passwordReset -refreshTokenHash -tokenVersion";

// Expose the code in responses ONLY in non-production, so automated tests can
// complete the flow without a real inbox. Never leaks in production.
const withDevCode = (body, code) => {
  if (process.env.NODE_ENV !== "production" && code) body.devCode = code;
  return body;
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, code } = await authService.register({ name, email, password });
  await emailService.sendVerificationCode(user.email, code);
  res
    .status(201)
    .json(
      withDevCode(
        { success: true, message: "Registered. Check your email for a verification code.", data: user },
        code
      )
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body);
  const { accessToken, refreshToken } = await authService.issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ success: true, message: "Email verified", data: publicUser(user) });
});

const resendVerification = asyncHandler(async (req, res) => {
  const code = await authService.resendVerification(req.body);
  if (code) await emailService.sendVerificationCode(req.body.email, code);
  res
    .status(200)
    .json(
      withDevCode({ success: true, message: "If that account needs verification, a code has been sent." }, code)
    );
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const { accessToken, refreshToken } = await authService.issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);
  // Do NOT return the access token in the body — it lives only in the httpOnly cookie
  // so JavaScript (and any XSS) cannot read it.
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: publicUser(user),
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select(SAFE_FIELDS);
  if (!user) throw new AppError("User not found", 404);
  res.status(200).json({ success: true, data: user });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError("No refresh token provided", 401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await User.findById(payload.userId);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError("Invalid refresh token", 401);
  }

  // Reuse detection: a validly-signed refresh token that is NOT the current
  // stored one means it was already rotated out (stolen/replayed) → revoke all.
  if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(token)) {
    user.tokenVersion += 1;
    user.refreshTokenHash = null;
    await user.save();
    clearAuthCookies(res);
    throw new AppError("Refresh token reuse detected. Please log in again.", 401);
  }

  const { accessToken, refreshToken } = await authService.issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ success: true, message: "Token refreshed" });
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.userId, { refreshTokenHash: null });
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: "Logout successful" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const code = await authService.forgotPassword(req.body);
  if (code) await emailService.sendResetCode(req.body.email, code);
  res
    .status(200)
    .json(
      withDevCode({ success: true, message: "If that email is registered, a reset code has been sent." }, code)
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.status(200).json({ success: true, message: "Password reset successful. Please log in." });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword({ userId: req.user.userId, ...req.body });
  // Re-issue tokens so the current session stays valid despite the tokenVersion bump.
  const { accessToken, refreshToken } = await authService.issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ success: true, message: "Password changed successfully" });
});

module.exports = {
  register,
  login,
  me,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
};
