const express = require("express");
const app = express();
const router = require("../routes/user.register");

app.use(express.json());

app.use("/user", router);

module.exports = app;
