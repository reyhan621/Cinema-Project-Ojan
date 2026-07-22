const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const validate = require("../middlewares/validate");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendSchema,
  forgotSchema,
  resetSchema,
  changePasswordSchema,
} = require("../validators/authSchemas");
const { loginLimiter, authLimiter } = require("../middlewares/rateLimiters");
const {
  register,
  login,
  me,
  logout,
  refresh,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");

router.post("/register", validate(registerSchema), register);

router.post("/login", loginLimiter, validate(loginSchema), login);

router.post("/verify-email", authLimiter, validate(verifyEmailSchema), verifyEmail);

router.post("/resend-verification", authLimiter, validate(resendSchema), resendVerification);

router.post("/forgot-password", authLimiter, validate(forgotSchema), forgotPassword);

router.post("/reset-password", authLimiter, validate(resetSchema), resetPassword);

router.post("/change-password", authenticate, validate(changePasswordSchema), changePassword);

router.post("/refresh", refresh);

router.get("/me", authenticate, me);

router.post("/logout", authenticate, logout);

module.exports = router;
