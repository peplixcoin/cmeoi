const OnlineOrder = require("../models/OnlineOrder");

// Place OnlineOrder Function
exports.placeOrder = async (req, res) => {
  try {
    const { order_id, username, order_time, address, mobile_no, items, total_amt, order_status, payment_status, completion_time } = req.body;

    const newOrder = new OnlineOrder({
      order_id,
      username,
      order_time,
      address,
      mobile_no,
      items,
      total_amt,
      order_status,
      payment_status,
      completion_time,
    });

    await newOrder.save();

    if (global.onlineOrderEmitter) {
      // Augment the order with isOnlineOrder flag
      const orderWithType = { ...newOrder.toObject(), isOnlineOrder: true };
      global.onlineOrderEmitter.emit('newOrder', orderWithType);
    }

    res.status(201).json({ message: "OnlineOrder placed successfully", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const { username } = req.params;
    const orders = await OnlineOrder.find({ username }).sort({ order_time: -1 });
    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get latest 5 orders for a user
exports.getLatestUserOrders = async (req, res) => {
  try {
    const { username } = req.params;
    const orders = await OnlineOrder.find({ username }).sort({ order_time: -1 }).limit(5);
    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Stream order updates for a user
exports.streamUserOrders = async (req, res) => {
  const { username } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const heartbeatInterval = setInterval(() => {
    res.write(':\n\n');
  }, 30000);

  const sendOrderUpdate = (order) => {
    if (order.username === username) {
      res.write(`data: ${JSON.stringify(order)}\n\n`);
    }
  };

  global.onlineOrderEmitter.on('orderUpdate', sendOrderUpdate);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    global.onlineOrderEmitter.off('orderUpdate', sendOrderUpdate);
    res.end();
  });
};

// Get today's orders (admin)
exports.getTodaysOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orders = await OnlineOrder.find({
      order_time: { $gte: today },
    }).sort({ order_time: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get approved orders (admin)

exports.getApprovedOrders = async (req, res) => {
  try {
    const { deliverymanId } = req.query;
    if (!deliverymanId) {
      return res.status(400).json({ message: 'deliverymanId is required' });
    }

    // Convert deliverymanId to ObjectId
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(deliverymanId);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid deliverymanId format' });
    }

    const query = {
      $or: [
        { order_status: 'approved' },
        { order_status: 'completed' },
      ],
      payment_status: { $ne: 'paid' },
      deliverymanId: objectId, // Use ObjectId for precise matching
    };

    console.log('getApprovedOrders Query:', JSON.stringify(query, null, 2)); // Enhanced debug log
    const orders = await OnlineOrder.find(query)
      .populate('deliverymanId', 'Username mobile_no')
      .sort({ order_time: -1 });
    console.log('Found orders count:', orders.length); // Debug log
    console.log('Found orders:', JSON.stringify(orders, null, 2)); // Detailed debug log
    res.json(orders);
  } catch (error) {
    console.error('Error in getApprovedOrders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Stream approved orders (admin)
exports.streamApprovedOrders = async (req, res) => {
  const { deliverymanId } = req.query;

  if (!deliverymanId) {
    res.status(400).json({ message: 'deliverymanId is required' });
    return;
  }

  // Convert deliverymanId to ObjectId
  let objectId;
  try {
    objectId = new mongoose.Types.ObjectId(deliverymanId);
  } catch (error) {
    res.status(400).json({ message: 'Invalid deliverymanId format' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const heartbeatInterval = setInterval(() => {
    res.write(':\n\n');
  }, 30000);

  const sendOrderUpdate = async (order) => {
    if (
      (order.order_status === 'approved' || order.order_status === 'completed') &&
      order.payment_status !== 'paid' &&
      order.deliverymanId &&
      order.deliverymanId.toString() === objectId.toString()
    ) {
      console.log('Streaming order:', order.order_id, 'for deliverymanId:', deliverymanId); // Enhanced debug log
      const populatedOrder = await OnlineOrder.findOne({ order_id: order.order_id })
        .populate('deliverymanId', 'Username mobile_no')
        .lean();
      console.log('Streamed order data:', JSON.stringify(populatedOrder, null, 2)); // Detailed debug log
      res.write(`data: ${JSON.stringify(populatedOrder)}\n\n`);
    }
  };

  global.onlineOrderEmitter.on('newOrder', sendOrderUpdate);
  global.onlineOrderEmitter.on('orderUpdate', sendOrderUpdate);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    global.onlineOrderEmitter.off('newOrder', sendOrderUpdate);
    global.onlineOrderEmitter.off('orderUpdate', sendOrderUpdate);
    res.end();
  });
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { order_status } = req.body;

    if (!["approved", "completed"].includes(order_status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const updateData = { order_status };
    if (order_status === "completed") {
      updateData.completion_time = new Date();
    }

    const order = await OnlineOrder.findOneAndUpdate(
      { order_id: orderId },
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "OnlineOrder not found" });
    }

    if (global.onlineOrderEmitter) {
      global.onlineOrderEmitter.emit('orderUpdate', order);
    }

    res.json({ message: "OnlineOrder status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update payment status (admin)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_status } = req.body;

    if (payment_status !== "paid") {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const order = await OnlineOrder.findOneAndUpdate(
      { order_id: orderId },
      { payment_status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "OnlineOrder not found" });
    }

    if (global.onlineOrderEmitter) {
      global.onlineOrderEmitter.emit('orderUpdate', order);
    }

    res.json({ message: "Payment status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
