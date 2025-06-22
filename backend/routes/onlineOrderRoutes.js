const express = require("express");
const onlineOrderController = require("../controllers/onlineOrderController");

const router = express.Router();

// Place Order Route (Already Present)
router.post("/placeorder", onlineOrderController.placeOrder);

// Fetch orders for a specific user
router.get("/orders/:username", onlineOrderController.getUserOrders);

// SSE endpoint for user-specific order updates
router.get("/orders/:username/stream", onlineOrderController.streamUserOrders);

// Fetch latest 5 orders for a specific user
router.get("/orders/:username/latest", onlineOrderController.getLatestUserOrders);


module.exports = router;
