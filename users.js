const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();
// Menggunakan authenticateToken agar dapat melakukan verifikasi
router.use(authenticateToken);

router.get("/", authorizeRole("penjual"), async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

router.get("/:id", authorizeRole("penjual"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

module.exports = router;
