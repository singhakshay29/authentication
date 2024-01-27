const jwt = require("jsonwebtoken");

function isLoggedIn(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({
      message: "You are not LoggedIn",
    });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "Something went wrong",
    });
  }
}

module.exports = isLoggedIn;
