const logger = require("./logger");
const User = require("../models/user");

const jwt = require("jsonwebtoken");

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "Unknown endpoint." });
};

const errorHandler = (err, req, res, next) => {
  logger.error(err.message);

  if (err.name === "CastError") {
    return res.status(400).send({ error: "Malformatted ID." });
  } else if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  } else if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: { token: "Invalid token." },
    });
  } else if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: { token: "Token expired." },
    });
  } else if (err.name === "Error") {
    return res.status(500).json({
      error: "Failed to load the ML model.",
    });
  }

  next(err);
};

const tokenExtractor = (req, res, next) => {
  const authorization = req.get("authorization");

  // console.log(authorization);

  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    req.token = authorization.substring(7);
  } else {
    req.token = null;
  }

  next();
};

const userExtractor = async (req, res, next) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET_KEY === undefined ? "DemraAI" : process.env.JWT_SECRET_KEY);

  if (!req.token || !decodedToken.id) {
    req.user = null;
    return res
      .status(401)
      .json({ error: { token: "Token missing or invalid" } });
  }

  req.user = await User.findById(decodedToken.id);
  // console.log(req.user);

  next();
};

module.exports = {
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
