const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/db.config");

exports.createUser = async (req, res) => {
  let { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please Enter all details" });
  } else if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password Should be atleast 6 characters" });
  } else if (typeof password !== "string") {
    return res.status(400).json({ message: "Password must be a string" });
  } else if (!email.includes("@")) {
    return res.status(400).json({ message: "Enter Valid Email Id" });
  } else {
    let hashedPassword = await bcrypt.hash(password, 10);
    pool.query(
      `SELECT * FROM userData
    WHERE email =$1`,
      [email],
      (error, result) => {
        if (error) {
          return res
            .status(400)
            .json({ message: `Something went wrong ${error}` });
        }
        if (result.rows.length > 0) {
          return res.status(400).json({ message: "User already registered" });
        } else {
          pool.query(
            `INSERT INTO userData(name,email,password)
                VALUES ($1,$2,$3)
                RETURNING password`,
            [name, email, hashedPassword],
            (error, result) => {
              if (error) {
                return res
                  .status(400)
                  .json({ message: `Something went wrong ${error}` });
              }
              if (result.rows.length > 0) {
                return res
                  .status(200)
                  .json({ message: "Registered Sucessfully" });
              }
            }
          );
        }
      }
    );
  }
};

exports.loginUser = async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please Enter all details" });
  } else if (!email.includes("@")) {
    return res.status(400).json({ message: "Enter Valid Email Id" });
  } else if (password.length < 6) {
    return res.status(400).json({ message: "Enter Valid Password" });
  } else {
    pool.query(
      `SELECT * FROM userData
            WHERE email=$1`,
      [email],
      (error, result) => {
        if (error) {
          return res
            .status(400)
            .json({ message: `Something went wrong ${error}` });
        } else if (result.rows.length > 0) {
          const user = result.rows[0];
          bcrypt.compare(password, user.password, (error, isMatch) => {
            if (error) {
              return res
                .status(400)
                .json({ message: `Something went wrong: ${error}` });
            } else if (isMatch) {
              const token = jwt.sign(
                { userId: user.userid, email: user.email },
                process.env.JWT_SECRET
              );
              res.cookie("token", token, { httpOnly: true });
              return res.status(200).json({
                message: "Login successfully",
              });
            } else {
              return res.status(400).json({ message: "Invalid password" });
            }
          });
        } else {
          return res.status(404).json({ message: "Invalid Email Id" });
        }
      }
    );
  }
};

exports.logoutUser = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({
      message: "You are not LoggedIn",
    });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return res.status(500).json(`Internal Server Error ${error}`);
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const data = await pool.query(`SELECT email,name FROM userData`);
    return res.status(200).json(data.rows);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json("Internal Server Error");
  }
};
