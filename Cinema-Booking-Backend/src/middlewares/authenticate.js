const { verifyAccessToken } = require("../utils/tokens");

const authenticate = (req, res, next) => {
  try {
    // Cookie-only auth for the browser SPA — the access token lives in an httpOnly
    // cookie that JavaScript cannot read, so there is no Bearer-header fallback.
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = authenticate;
console.log("Authentication middleware loaded successfully.");
