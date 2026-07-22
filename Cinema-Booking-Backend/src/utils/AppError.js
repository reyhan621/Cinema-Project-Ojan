// Operational error with an explicit HTTP status code. Thrown by controllers
// and services for expected failures (404, 409, 403, ...).
class AppError extends Error {
  // `code` is an optional, stable machine-readable string (e.g. "EMAIL_NOT_VERIFIED")
  // that the client can branch on without fragile message string-matching. It is only
  // exposed for operational errors (see errorHandler), so it never leaks internals.
  constructor(message, statusCode = 500, code) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (code) this.code = code;
  }
}

module.exports = AppError;
