const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/db.config");

exports.createUser = async (req, res) => {
  let { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json("Please Enter all details");
  } else if (password.length < 6) {
    return res.status(400).json("Password Should be atleast 6 characters");
  } else if (!email.includes("@")) {
    return res.status(400).json("Enter Valid Email Id");
  } else {
    let hashedPassword = await bcrypt.hash(password, 10);
    pool.query(
      `SELECT * FROM userData
    WHERE email =$1`,
      [email],
      (error, result) => {
        if (error) {
          return res.status(400).json(`Something went wrong ${error}`);
        }
        if (result.rows.length > 0) {
          return res.status(400).json("User already registered");
        } else {
          pool.query(
            `INSERT INTO userData(name,email,password)
                VALUES ($1,$2,$3)
                RETURNING password`,
            [name, email, hashedPassword],
            (error, result) => {
              if (error) {
                return res.status(400).json(`Something went wrong ${error}`);
              }
              if (result.rows.length > 0) {
                return res.status(200).json("Registered Sucessfully");
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
    res.status(400).json("Please Enter all details");
  } else if (!email.includes("@")) {
    res.status(400).json("Enter Valid Email Id");
  } else if (password.length < 6) {
    res.status(400).json("Enter Valid Password");
  } else {
    pool.query(
      `SELECT * FROM userData
            WHERE email=$1`,
      [email],
      (error, result) => {
        if (error) {
          res.status(400).json(`Something went wrong ${error}`);
        } else if (result.rows.length > 0) {
          const user = result.rows[0];
          bcrypt.compare(password, user.password, (error, isMatch) => {
            if (error) {
              res.status(400).json(`Something went wrong: ${error}`);
            } else if (isMatch) {
              const token = jwt.sign(
                { userId: user.userid, email: user.email },
                process.env.JWT_SECRET
              );
              res.status(200).json({
                message: "User authenticated successfully",
                token: token,
              });
            } else {
              res.status(400).json("Invalid password");
            }
          });
        } else {
          res.status(404).json("User not found");
        }
      }
    );
  }
};

exports.logoutUser = async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      message: "Authentication failed: Missing token.",
      status: "Error",
    });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    res.clearCookie("token");
    return res
      .status(200)
      .json({ message: "Logged out successfully.", status: "Success" });
  } catch (error) {
    res.status(500).json("Internal Server Error");
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
