const express = require("express"); // Mengimpor modul express untuk membuat aplikasi web
const { authenticateToken, authorizeRole } = require("../middleware/auth"); // Mengimpor middleware untuk autentikasi dan otorisasi
const Order = require("../models/Order"); // Mengimpor model Order
const OrderDetails = require("../models/OrderDetails"); // Mengimpor model OrderDetails
const ShippingDetails = require("../models/ShippingDetails"); // Mengimpor model ShippingDetails
const Product = require("../models/Product"); // Mengimpor model Product
const router = express.Router(); // Membuat instance router Express

// Route untuk mendapatkan daftar semua pesanan
router.get(
  "/",
  authenticateToken,
  authorizeRole("penjual"),
  async (req, res) => {
    try {
      // Mengambil semua pesanan dan menyertakan detail produk
      const orders = await Order.findAll({
        include: [
          { model: Product, through: { attributes: ["quantity", "price"] } },
        ],
      });
      // Mengirimkan daftar pesanan dalam format JSON
      res.status(200).json(orders);
    } catch (error) {
      // Menangani kesalahan dengan mengirimkan status 500 dan pesan kesalahan
      res
        .status(500)
        .json({ message: "Error fetching orders", error: error.message });
    }
  }
);

// Route untuk membuat pesanan baru
router.post("/", authenticateToken, async (req, res) => {
  const { userId, products, shippingDetails } = req.body;
  try {
    // Menghitung total jumlah pesanan
    const totalAmount = products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    // Membuat pesanan baru
    const order = await Order.create({
      userId,
      status: "sedang diproses",
      totalAmount,
    });
    // Menambahkan detail pesanan untuk setiap produk
    for (const product of products) {
      await OrderDetails.create({
        orderId: order.id,
        productId: product.id,
        quantity: product.quantity,
        price: product.price,
      });
    }
    // Menambahkan detail pengiriman
    if (shippingDetails) {
      await ShippingDetails.create({ orderId: order.id, ...shippingDetails });
    }
    // Mengirimkan respon sukses dengan status 201
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    // Menangani kesalahan dengan mengirimkan status 400 dan pesan kesalahan
    res
      .status(400)
      .json({ message: "Error creating order", error: error.message });
  }
});

// Route untuk memperbarui pesanan berdasarkan ID
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("penjual"),
  async (req, res) => {
    const { status, shippingDetails } = req.body;
    try {
      // Mencari pesanan berdasarkan ID
      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      // Memperbarui status pesanan
      await order.update({ status });
      // Memperbarui detail pengiriman jika ada
      if (shippingDetails) {
        const existingShippingDetails = await ShippingDetails.findOne({
          where: { orderId: order.id },
        });
        if (existingShippingDetails) {
          await existingShippingDetails.update(shippingDetails);
        } else {
          await ShippingDetails.create({
            orderId: order.id,
            ...shippingDetails,
          });
        }
      }
      // Mengirimkan respon sukses dengan status 200
      res.status(200).json({
        message: "Order updated successfully",
        shippingDetails,
        order,
      });
    } catch (error) {
      // Menangani kesalahan dengan mengirimkan status 400 dan pesan kesalahan
      res
        .status(400)
        .json({ message: "Error updating order", error: error.message });
    }
  }
);

// Route untuk menghapus pesanan berdasarkan ID
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("penjual"),
  async (req, res) => {
    try {
      // Mencari pesanan berdasarkan ID
      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Menghapus detail pengiriman jika ada
      await ShippingDetails.destroy({ where: { orderId: order.id } });

      // Menghapus detail pesanan
      await OrderDetails.destroy({ where: { orderId: order.id } });

      // Menghapus pesanan
      await order.destroy();

      // Mengirimkan respon sukses dengan status 200
      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      // Menangani kesalahan dengan mengirimkan status 500 dan pesan kesalahan
      res
        .status(500)
        .json({ message: "Error deleting order", error: error.message });
    }
  }
);

module.exports = router; // Mengekspor router untuk digunakan di bagian lain aplikasi
