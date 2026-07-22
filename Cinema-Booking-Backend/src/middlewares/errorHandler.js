// 404 for any route that no handler matched.
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
};

// Centralized error handler — the single place that turns any error into a safe,
// consistent JSON response. Express recognizes it as an error handler by its
// 4-argument signature.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Map common Mongoose errors to clean client-facing responses.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate value violates a unique constraint";
  }

  // Never leak internals for unexpected (5xx) errors.
  if (statusCode >= 500) {
    if (process.env.NODE_ENV !== "test") console.error(err);
    if (process.env.NODE_ENV === "production") message = "Internal server error";
  }

  const body = { success: false, message };
  // Surface an explicit error code ONLY for our own operational AppErrors, so the
  // client can branch reliably. `isOperational` guards against leaking incidental
  // Node/Mongo codes (e.g. "ECONNREFUSED", numeric 11000) from unexpected errors.
  if (err.isOperational && typeof err.code === "string") body.code = err.code;

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
