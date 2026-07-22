// Generic zod validation middleware.
// Parses req.body against a schema; on failure returns a clean 400 (never
// letting a malformed value reach the database), on success replaces req.body
// with the parsed (trimmed/lowercased/coerced) data.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => i.message);
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  req.body = result.data;
  next();
};

module.exports = validate;
