const Order = require("../models/Order");

// Place Order Function
exports.placeOrder = async (req, res) => {
  try {
    const { order_id, username, table_number, order_time, items, total_amt, order_status, payment_status, completion_time } = req.body;

    const newOrder = new Order({
      order_id,
      username,
      table_number,
      order_time,
      items,
      total_amt,
      order_status,
      payment_status,
      completion_time,
    });

    await newOrder.save();

    // Emit the new order to the SSE stream
    if (global.dineOrderEmitter) {
      global.dineOrderEmitter.emit('newOrder', newOrder);
    }

    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getUserOrders = async (req, res) => {
  try {
    const { username } = req.params;
    const orders = await Order.find({ username }).sort({ order_time: -1 }); // Most recent orders first

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Fetch latest 5 orders for a specific user
exports.getLatestUserOrders = async (req, res) => {
  try {
    const { username } = req.params;
    const orders = await Order.find({ username }).sort({ order_time: -1 }).limit(5); // Fetch latest 5 orders

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching latest user orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// SSE: Stream order updates for a specific user
exports.streamUserOrders = async (req, res) => {
  const { username } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send a heartbeat to keep the connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(':\n\n'); // SSE heartbeat
  }, 30000);

  // Function to send order updates to the client
  const sendOrderUpdate = (order) => {
    if (order.username === username) {
      res.write(`data: ${JSON.stringify(order)}\n\n`);
    }
  };

  // Listen for order updates (using the global event emitter)
  global.dineOrderEmitter.on('orderUpdate', sendOrderUpdate);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    global.dineOrderEmitter.off('orderUpdate', sendOrderUpdate);
    res.end();
  });
};