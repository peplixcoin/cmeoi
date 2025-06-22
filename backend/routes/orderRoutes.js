const express = require("express");
const orderController = require("../controllers/orderController");

const router = express.Router();

// Place Order Route (Already Present)
router.post("/placeorder", orderController.placeOrder);

// Fetch orders for a specific user
router.get("/orders/:username", orderController.getUserOrders);

// SSE endpoint for user-specific order updates
router.get("/orders/:username/stream", orderController.streamUserOrders);

// Fetch latest 5 orders for a specific user
router.get("/orders/:username/latest", orderController.getLatestUserOrders);


module.exports = router;
