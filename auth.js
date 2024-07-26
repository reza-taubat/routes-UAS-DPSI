const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { Op } = require("sequelize");
const router = express.Router();
require("dotenv").config();

router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  try {
    // Membuat user baru dengan atribut yang sesuai
    const user = await User.create({ username, password, role });
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(400).json({ message: "Error registering user", error });
  }
});

router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { id: identifier }],
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Is Password Valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login success", token });
  } catch (error) {
    res.status(500).json({ message: "Error while logging in", error });
  }
});

module.exports = router;
