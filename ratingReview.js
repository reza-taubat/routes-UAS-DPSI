const express = require("express"); // Mengimpor modul express untuk membuat router dan menangani route HTTP
const { authenticateToken, authorizeRole } = require("../middleware/auth"); // Mengimpor middleware untuk autentikasi dan otorisasi
const RatingReview = require("../models/RatingReview"); // Mengimpor model RatingReview untuk berinteraksi dengan tabel rating/review
const Order = require("../models/Order"); // Mengimpor model Order untuk berinteraksi dengan tabel order
const router = express.Router(); // Membuat router baru dari express

// Route untuk menambahkan rating dan review
router.post(
  "/",
  authenticateToken, // Middleware untuk memverifikasi token JWT dan autentikasi pengguna
  authorizeRole("pelanggan"), // Middleware untuk memastikan hanya pengguna dengan role "pelanggan" yang dapat mengakses route ini
  async (req, res, next) => {
    try {
      // Mendapatkan data dari body request
      const { orderId, productId, rating, reviewText } = req.body;
      const userId = req.user.id; // Mengambil ID pengguna dari req.user setelah autentikasi
      console.log(userId);

      // Memeriksa apakah semua field yang diperlukan ada
      if (!orderId || !productId || !rating) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Mengecek apakah order dengan ID yang diberikan ada dan statusnya "selesai"
      const order = await Order.findOne({
        where: {
          id: orderId,
          userId: userId,
          status: "selesai",
        },
      });

      // Jika order tidak ditemukan atau statusnya bukan "selesai", kirimkan respons error
      if (!order) {
        return res
          .status(400)
          .json({ error: "Order not found or not completed" });
      }

      // Membuat entry baru di tabel RatingReview
      const newRatingReview = await RatingReview.create({
        userId,
        productId,
        orderId,
        rating,
        reviewText,
      });

      // Mengirimkan respons sukses dengan status 201 Created dan data rating/review baru
      res
        .status(201)
        .json({ message: "Rating berhasil ditambahkan", newRatingReview });
    } catch (error) {
      // Jika terjadi error, meneruskan error ke middleware penanganan error
      next(error);
    }
  }
);

// Route untuk mendapatkan semua rating dan review
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    // Mendapatkan semua rating dan review dari database
    const ratingReviews = await RatingReview.findAll({
      include: [
        { model: Order, attributes: ["id", "status"] }, // Menyertakan informasi order seperti ID dan status
      ],
    });

    // Mengirimkan respons sukses dengan status 200 OK dan data rating/review
    res.status(200).json(ratingReviews);
  } catch (error) {
    // Jika terjadi error, meneruskan error ke middleware penanganan error
    next(error);
  }
});

module.exports = router; // Mengekspor router untuk digunakan di aplikasi utama
