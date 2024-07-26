const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const Product = require("../models/Product");
const router = express.Router();

// Route to fetch all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll(); // Fetch all products from the database
    res.status(200).json(products); // Send the products as a JSON response
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error }); // Handle errors
  }
});

// Route to create a new product
router.post(
  "/",
  authenticateToken, // Middleware to authenticate the token
  authorizeRole("penjual"), // Middleware to authorize only users with the "penjual" role
  async (req, res) => {
    const { name, description, price, stock, category, imageUrl } = req.body;
    try {
      const product = await Product.create({
        name,
        description,
        price,
        stock,
        category,
        imageUrl,
      }); // Create a new product in the database
      res
        .status(201)
        .json({ message: "Product created successfully", product }); // Send a success message with the created product
    } catch (error) {
      res.status(400).json({ message: "Error creating product", error }); // Handle errors
    }
  }
);

// Route to update an existing product
router.put(
  "/:id",
  authenticateToken, // Middleware to authenticate the token
  authorizeRole("penjual"), // Middleware to authorize only users with the "penjual" role
  async (req, res) => {
    const { name, description, price, stock, category, imageUrl } = req.body;
    try {
      const product = await Product.findByPk(req.params.id); // Find the product by its primary key (id)
      if (!product) {
        return res.status(404).json({ message: "Product not found" }); // Handle case when product is not found
      }
      await product.update({
        name,
        description,
        price,
        stock,
        category,
        imageUrl,
      }); // Update the product with new data
      res
        .status(200)
        .json({ message: "Product updated successfully", product }); // Send a success message with the updated product
    } catch (error) {
      res.status(400).json({ message: "Error updating product", error }); // Handle errors
    }
  }
);

// Route to delete a product
router.delete(
  "/:id",
  authenticateToken, // Middleware to authenticate the token
  authorizeRole("penjual"), // Middleware to authorize only users with the "penjual" role
  async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id); // Find the product by its primary key (id)
      if (!product) {
        return res.status(404).json({ message: "Product not found" }); // Handle case when product is not found
      }
      await product.destroy(); // Delete the product from the database
      res.status(200).json({ message: "Product deleted successfully" }); // Send a success message
    } catch (error) {
      res.status(500).json({ message: "Error deleting product", error }); // Handle errors
    }
  }
);

module.exports = router; // Export the router
