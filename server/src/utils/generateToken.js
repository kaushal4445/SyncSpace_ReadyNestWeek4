const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sendTokenCookie = (res, token) => {
  const cookieExpiresDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7;
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(Date.now() + cookieExpiresDays * 24 * 60 * 60 * 1000),
  });
};

module.exports = { generateToken, sendTokenCookie };
