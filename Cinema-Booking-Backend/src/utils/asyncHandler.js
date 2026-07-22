// Wraps an async controller so any thrown/rejected error is forwarded to the
// centralized Express error handler instead of crashing or hanging the request.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
