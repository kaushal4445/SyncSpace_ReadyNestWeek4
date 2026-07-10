const { validationResult } = require("express-validator");

// Drop-in middleware placed after an array of express-validator checks.
// Keeps every route file from re-implementing this same boilerplate.
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validateRequest;
