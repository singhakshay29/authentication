const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const router = require("../routes/user.register");

app.use(express.json());
app.use(cookieParser());

app.use("/user", router);

module.exports = app;
