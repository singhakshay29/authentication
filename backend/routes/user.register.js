const express = require("express");
const {
  createUser,
  getAllUser,
  loginUser,
  logoutUser,
} = require("../controllers/user.controllers");
const isLoggedIn = require("../middleware/isLoggedIn");
const router = express.Router();

router.get("/userlist", getAllUser);
router.post("/login", loginUser);
router.post("/logout", isLoggedIn, logoutUser);
router.post("/register", createUser);

module.exports = router;
