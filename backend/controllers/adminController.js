// node js backend admincontroller page

const Admin = require("../models/Admin");
const Menu = require("../models/Menu");
const Order = require("../models/Order");
const Feedback = require("../models/Feedback");
const OnlineFeedback = require("../models/OnlineFeedback");
const OnlineOrder = require("../models/OnlineOrder");
const EventRegistration = require('../models/EventRegistration');
const User = require("../models/User");
const Event = require('../models/Event');
const Lounge = require('../models/Lounge');
const Booking = require('../models/Booking');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const mongoose = require('mongoose');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// adminController.js
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findOne({ Username: username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });
    // Validate password
    const isMatch = await bcrypt.compare(password, admin.Password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: admin.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update availability of a menu item
exports.updateMenuAvailability = async (req, res) => {
  try {
    const { id } = req.params; // This is actually item_id
    const { availability } = req.body;

    // Validate availability input
    if (typeof availability !== "boolean") {
      return res.status(400).json({ message: "Invalid availability value" });
    }

    console.log(
      "Updating availability for menu item_id:",
      id,
      "to",
      availability
    );

    // Use item_id instead of _id
    const updatedMenu = await Menu.findOneAndUpdate(
      { item_id: id }, // Query by item_id, not _id
      { availability },
      { new: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ message: "Availability updated", menu: updatedMenu });
  } catch (error) {
    console.error("Error updating menu availability:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `menu_${uuidv4()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

const eventUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Export multer middleware for routes
exports.uploadMiddleware = upload.single("item_img");
exports.eventUploadMiddleware = eventUpload.single("eventImage");

exports.deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const deletedItem = await Menu.findOneAndDelete({ item_id: itemId });

    if (!deletedItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ message: "Menu item deleted successfully", deletedItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch all orders

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update dine order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_status } = req.body;
    const { orderId } = req.params;

    // Check if order exists
    const order = await Order.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status
    order.order_status = order_status;
    if (order_status === "completed") {
      order.completion_time = new Date();
    }

    await order.save();

    // Emit the updated order to the SSE stream
    if (global.dineOrderEmitter) {
      const orderWithType = { ...order.toObject(), isOnlineOrder: false };
      global.dineOrderEmitter.emit("orderUpdate", orderWithType);
    }

    res.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update online order status
exports.updateOnlineOrderStatus = async (req, res) => {
  try {
    const { order_status } = req.body;
    const { orderId } = req.params;

    // Check if order exists
    const order = await OnlineOrder.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If marking as completed, ensure a delivery man is assigned
    if (order_status === "completed" && !order.deliverymanId) {
      return res.status(400).json({ message: "A delivery man must be assigned before marking as completed" });
    }

    // Update order status
    order.order_status = order_status;
    if (order_status === "completed") {
      order.completion_time = new Date();
    }

    await order.save();

    // Populate deliverymanId for SSE
    const populatedOrder = await OnlineOrder.findOne({ order_id: orderId }).populate('deliverymanId', 'Username mobile_no');

    // Emit the updated order to the SSE stream
    if (global.onlineOrderEmitter) {
      const orderWithType = { ...populatedOrder.toObject(), isOnlineOrder: true };
      global.onlineOrderEmitter.emit("orderUpdate", orderWithType);
    }

    res.json({ message: "Order status updated", order: populatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Assign delivery man to an online order
exports.assignDeliveryMan = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliverymanId } = req.body;

    // Validate deliverymanId
    const deliveryMan = await Admin.findById(deliverymanId);
    if (!deliveryMan || deliveryMan.role !== 'DeliveryMan') {
      return res.status(400).json({ message: "Invalid or non-existent delivery man" });
    }

    // Check if order exists
    const order = await OnlineOrder.findOne({ order_id: orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Assign delivery man
    order.deliverymanId = deliverymanId;
    await order.save();

    // Populate deliverymanId for response
    const populatedOrder = await OnlineOrder.findOne({ order_id: orderId }).populate('deliverymanId', 'Username mobile_no');

    // Emit the updated order to the SSE stream
    if (global.onlineOrderEmitter) {
      const orderWithType = { ...populatedOrder.toObject(), isOnlineOrder: true };
      global.onlineOrderEmitter.emit("orderUpdate", orderWithType);
    }

    res.json({ message: "Delivery man assigned", order: populatedOrder });
  } catch (error) {
    console.error("Error assigning delivery man:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update dine order payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const updatedOrder = await Order.findOneAndUpdate(
      { order_id: orderId },
      { payment_status: "paid" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Emit the updated order to the SSE stream
    if (global.dineOrderEmitter) {
      global.dineOrderEmitter.emit("orderUpdate", updatedOrder);
    }

    res.json({ message: "Payment status updated", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update online order payment status
exports.updateOnlinePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const updatedOrder = await OnlineOrder.findOneAndUpdate(
      { order_id: orderId },
      { payment_status: "paid" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Populate deliverymanId for SSE
    const populatedOrder = await OnlineOrder.findOne({ order_id: orderId }).populate('deliverymanId', 'Username mobile_no');

    // Emit the updated order to the SSE stream
    if (global.onlineOrderEmitter) {
      global.onlineOrderEmitter.emit("orderUpdate", populatedOrder);
    }

    res.json({ message: "Payment status updated", order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.editOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newItems } = req.body; // Array of items (add/remove)

    // Fetch the existing order
    const order = await Order.findOne({ order_id: orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Update the items in the order
    order.items = newItems;

    // Recalculate total amount
    order.total_amt = newItems.reduce((acc, item) => acc + item.total_price, 0);

    await order.save();

    // Emit the updated order to the SSE stream
    if (global.dineOrderEmitter) {
      global.dineOrderEmitter.emit("orderUpdate", order);
    }

    res.json({ message: "Order updated successfully", updatedOrder: order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update the existing streamOrders function to handle only dine orders
exports.streamDineOrders = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const heartbeatInterval = setInterval(() => {
    res.write(":\n\n");
  }, 30000);

  const sendOrderUpdate = (order) => {
    if (!order.isOnlineOrder) {
      res.write(`data: ${JSON.stringify(order)}\n\n`);
    }
  };

  global.dineOrderEmitter.on('newOrder', sendOrderUpdate);
  global.dineOrderEmitter.on('orderUpdate', sendOrderUpdate);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    global.dineOrderEmitter.off('newOrder', sendOrderUpdate);
    global.dineOrderEmitter.off('orderUpdate', sendOrderUpdate);
    res.end();
  });
};

// Add new function for online orders stream
exports.streamOnlineOrders = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const heartbeatInterval = setInterval(() => {
    res.write(":\n\n");
  }, 30000);

  const sendOrderUpdate = (order) => {
    if (order.isOnlineOrder) {
      res.write(`data: ${JSON.stringify(order)}\n\n`);
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

// Fetch all Dine feedbacks
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ created_at: -1 }); // Sort by latest first
    // Calculate average rating for each feedback
    const feedbacksWithAvg = feedbacks.map((feedback) => {
      const ratings = feedback.ratings;
      const avgRating =
        (ratings.taste + ratings.service + ratings.hygiene + ratings.behavior) /
        4;
      return {
        ...feedback.toObject(),
        avgRating: parseFloat(avgRating.toFixed(1)),
      };
    });
    res.json(feedbacksWithAvg);
  } catch (error) {
    res.status(500).json({ message: "Error fetching feedbacks", error });
  }
};

// Fetch all Online feedbacks
exports.getAllOnlineFeedbacks = async (req, res) => {
  try {
    const feedbacks = await OnlineFeedback.find().sort({ created_at: -1 }); // Sort by latest first
    // Calculate average rating for each feedback
    const feedbacksWithAvg = feedbacks.map((feedback) => {
      const ratings = feedback.ratings;
      const avgRating =
        (ratings.taste + ratings.service + ratings.hygiene + ratings.behavior) /
        4;
      return {
        ...feedback.toObject(),
        avgRating: parseFloat(avgRating.toFixed(1)),
      };
    });
    res.json(feedbacksWithAvg);
  } catch (error) {
    res.status(500).json({ message: "Error fetching feedbacks", error });
  }
};

// Fetch today's Dine orders
exports.getTodaysOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of the day

    const orders = await Order.find({
      order_time: {
        $gte: today, // Greater than or equal to today's start
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Less than tomorrow's start
      },
    }).sort({ order_time: -1 }); // Sort by order_time (newest first)

    res.json(orders);
  } catch (error) {
    console.error("Error fetching today's orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch today's Online orders
exports.getTodaysOnlineOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of the day

    const orders = await OnlineOrder.find({
      order_time: {
        $gte: today, // Greater than or equal to today's start
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Less than tomorrow's start
      },
    })
      .populate('deliverymanId', 'Username mobile_no')
      .sort({ order_time: -1 }); // Sort by order_time (newest first)

    res.json(orders);
  } catch (error) {
    console.error("Error fetching today's orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch dine orders by month
exports.getMonthlyOrders = async (req, res) => {
  try {
    const { month } = req.params; // Expecting format YYYY-MM

    // Parse the month and year from the input
    const [year, monthNumber] = month.split("-");
    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 1);

    const orders = await Order.find({
      order_time: {
        $gte: startDate,
        $lt: endDate,
      },
      payment_status: "paid",
      order_status: "completed",
    }).sort({ order_time: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching monthly orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch online orders by month
exports.getMonthlyOnlineOrders = async (req, res) => {
  try {
    const { month } = req.params; // Expecting format YYYY-MM

    // Parse the month and year from the input
    const [year, monthNumber] = month.split("-");
    const startDate = new Date(year, monthNumber - 1, 1);
    const endDate = new Date(year, monthNumber, 1);

    const orders = await OnlineOrder.find({
      order_time: {
        $gte: startDate,
        $lt: endDate,
      },
      payment_status: "paid",
      order_status: "completed",
    })
      .populate('deliverymanId', 'Username mobile_no')
      .sort({ order_time: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching monthly orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    const {
      item_name,
      item_cty,
      item_subcty,
      item_price,
      isveg,
      availability,
    } = req.body;

    if (
      !item_name ||
      !item_cty ||
      !item_subcty ||
      !item_price ||
      availability === undefined ||
      isveg === undefined
    ) {
      return res
        .status(400)
        .json({ message: "All fields except image are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Upload image to Cloudinary with optimization
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "menu_items", // Optional: Organize images in a folder
      transformation: [
        { width: 300, height: 300, crop: "limit" }, // Resize to max 500x500
        { quality: "auto", fetch_format: "auto" }, // Optimize quality and format
      ],
    });

    // Create and save menu item
    const newMenuItem = new Menu({
      item_id: `item_${uuidv4().split("-")[0]}`,
      item_name,
      item_cty,
      item_subcty,
      item_price: Number(item_price),
      isveg: Boolean(isveg),
      availability: Boolean(availability),
      item_img: result.secure_url, // Use Cloudinary's secure URL
    });

    await newMenuItem.save();
    res
      .status(201)
      .json({ message: "Menu item added successfully", menu: newMenuItem });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params; // item_id of the menu item to update
    const {
      item_name,
      item_cty,
      item_subcty,
      item_price,
      isveg,
      availability,
    } = req.body;

    // Validate required fields
    if (
      !item_name ||
      !item_cty ||
      !item_subcty ||
      !item_price ||
      availability === undefined ||
      isveg === undefined
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the menu item exists
    const existingItem = await Menu.findOne({ item_id: itemId });
    if (!existingItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    let item_img = existingItem.item_img;

    // If a new file is uploaded, upload it to Cloudinary with optimization
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "menu_items", // Optional: Organize images in a folder
        transformation: [
          { width: 300, height: 300, crop: "limit" }, // Resize to max 500x500
          { quality: "auto", fetch_format: "auto" }, // Optimize quality and format
        ],
      });
      item_img = result.secure_url;
    }

    // Update the menu item
    const updatedItem = await Menu.findOneAndUpdate(
      { item_id: itemId },
      {
        item_name,
        item_cty,
        item_subcty,
        item_price: Number(item_price),
        isveg: Boolean(isveg),
        availability: Boolean(availability),
        item_img, // Use Cloudinary's secure URL
      },
      { new: true } // Return the updated document
    );

    res.json({ message: "Menu item updated successfully", menu: updatedItem });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch dine orders by specific date
exports.getOrdersByDate = async (req, res) => {
  try {
    const { date } = req.params; // Expecting format YYYY-MM-DD

    // Parse the date
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0); // Start of the day
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1); // Start of next day

    const orders = await Order.find({
      order_time: {
        $gte: selectedDate, // Greater than or equal to selected date
        $lt: nextDate, // Less than next day
      },
      payment_status: "paid",
      order_status: "completed",
    }).sort({ order_time: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders by date:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch online orders by specific date
exports.getOnlineOrdersByDate = async (req, res) => {
  try {
    const { date } = req.params; // Expecting format YYYY-MM-DD

    // Parse the date
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0); // Start of the day
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1); // Start of next day

    const orders = await OnlineOrder.find({
      order_time: {
        $gte: selectedDate, // Greater than or equal to selected date
        $lt: nextDate, // Less than next day
      },
      payment_status: "paid",
      order_status: "completed",
    })
      .populate('deliverymanId', 'Username mobile_no')
      .sort({ order_time: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders by date:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Fetch current month's dine orders with pagination
exports.getCurrentMonthOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [orders, total] = await Promise.all([
      Order.find({
        order_time: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
        payment_status: "paid",
        order_status: "completed",
      })
        .sort({ order_time: -1 })
        .skip(skip)
        .limit(limit),

      Order.countDocuments({
        order_time: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
        payment_status: "paid",
        order_status: "completed",
      }),
    ]);

    res.json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error("Error fetching current month orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch current month's online orders with pagination
exports.getCurrentMonthOnlineOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [orders, total] = await Promise.all([
      OnlineOrder.find({
        order_time: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
        payment_status: "paid",
        order_status: "completed",
      })
        .populate('deliverymanId', 'Username mobile_no')
        .sort({ order_time: -1 })
        .skip(skip)
        .limit(limit),

      OnlineOrder.countDocuments({
        order_time: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
        payment_status: "paid",
        order_status: "completed",
      }),
    ]);

    res.json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error("Error fetching current month orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch today's approved orders for cook
exports.getApprovedOrders = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of the day

    const orders = await Order.find({
      order_status: "approved",
      payment_status: "pending", // Ensure only non-completed orders are shown
      order_time: {
        $gte: today, // Greater than or equal to today's start
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Less than tomorrow's start
      },
    }).sort({ order_time: -1 }); // Sort by newest first

    res.json(orders);
  } catch (error) {
    console.error("Error fetching today's approved orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getApprovedOnlineOrders = async (req, res) => {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of the day

    const query = {
      $or: [
        { order_status: 'approved' },
        { order_status: 'completed' },
      ],
      payment_status: { $ne: 'paid' },
      deliverymanId: objectId,
      order_time: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    };

    const orders = await OnlineOrder.find(query)
      .populate('deliverymanId', 'Username mobile_no')
      .sort({ order_time: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching approved online orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// SSE: Stream today's approved orders for cook
exports.streamApprovedOrders = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send a heartbeat to keep the connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(":\n\n"); // SSE heartbeat
  }, 30000);

  // Function to send order updates to the client
  const sendOrderUpdate = (order) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of the day
    const orderDate = new Date(order.order_time);

    // Send approved orders from today or orders that have been updated (including to completed)
    if (
      (order.table_number &&
        order.order_status === "approved" &&
        order.payment_status === "pending" &&
        orderDate >= today &&
        orderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) ||
      (order.order_status === "completed" &&
        orderDate >= today &&
        orderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000))
    ) {
      res.write(`data: ${JSON.stringify(order)}\n\n`);
    }
  };

  // Listen for order updates and new orders
  global.dineOrderEmitter.on("orderUpdate", sendOrderUpdate);
  global.dineOrderEmitter.on("newOrder", sendOrderUpdate);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    global.dineOrderEmitter.off("orderUpdate", sendOrderUpdate);
    global.dineOrderEmitter.off("newOrder", sendOrderUpdate);
    res.end();
  });
};

// SSE: Stream today's approved online orders for cook
exports.streamApprovedOnlineOrders = async (req, res) => {
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
    res.write(':\n\n'); // SSE heartbeat
  }, 30000);

  const sendOrderUpdate = async (order) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(order.order_time);

    if (
      (order.order_status === 'approved' || order.order_status === 'completed') &&
      order.payment_status !== 'paid' &&
      order.deliverymanId &&
      order.deliverymanId.toString() === objectId.toString() &&
      orderDate >= today &&
      orderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    ) {
      const populatedOrder = await OnlineOrder.findOne({ order_id: order.order_id })
        .populate('deliverymanId', 'Username mobile_no')
        .lean();
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


exports.getAllDeliveryMen = async (req, res) => {
  try {
    const deliveryman = await Admin.find({ role: 'DeliveryMan' }).select('-Password');
    res.json(deliveryman);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createDeliveryMan = async (req, res) => {
  try {
    const { username, password, mobile_no } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newDeliveryMan = new Admin({
      Username: username,
      Password: hashedPassword,
      mobile_no,
      role: 'DeliveryMan'
    });

    await newDeliveryMan.save();
    res.status(201).json({ message: 'Delivery man created successfully', DeliveryMan: newDeliveryMan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateDeliveryMan = async (req, res) => {
  try {
    const { deliverymanId } = req.params;
    const { username, mobile_no, password } = req.body;

    const updates = { Username: username, mobile_no };
    if (password) {
      updates.Password = await bcrypt.hash(password, 10);
    }

    const updatedDeliveryMan = await Admin.findByIdAndUpdate(
      deliverymanId,
      updates,
      { new: true }
    ).select('-Password');

    if (!updatedDeliveryMan) return res.status(404).json({ message: 'Delivery man not found' });
    res.json({ message: 'Delivery man updated successfully', DeliveryMan: updatedDeliveryMan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteDeliveryMan = async (req, res) => {
  try {
    const { deliverymanId } = req.params;
    const deletedDeliveryMan = await Admin.findByIdAndDelete(deliverymanId);
    
    if (!deletedDeliveryMan) return res.status(404).json({ message: 'Delivery man not found' });
    res.json({ message: 'Delivery man deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// adminController.js - Add these methods to the exports

exports.createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      location,
      capacity,
      isPaid,
      price = 0,
      guest_price = 0,
    } = req.body;

    // Generate unique event ID
    const eventId = `event_${Math.random().toString(36).substr(2, 9)}`;

    let imageUrl = '';
    
    // If image was uploaded, process it
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "event_images",
        transformation: [
          { width: 500, height: 375, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      });
      imageUrl = result.secure_url;
      
      // Delete the temporary file
      fs.unlinkSync(req.file.path);
    }

    const newEvent = new Event({
      eventId,
      name,
      description,
      date: new Date(date),
      startTime,
      endTime,
      location,
      capacity,
      isPaid,
      price: isPaid ? price : 0,
      guest_price: isPaid ? guest_price : 0,
      imageUrl,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    // Convert date string to Date object if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    // If image was uploaded, process it
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "event_images",
        transformation: [
          { width: 500, height: 375, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      });
      updateData.imageUrl = result.secure_url;
      
      // Delete the temporary file
      fs.unlinkSync(req.file.path);
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { eventId },
      updateData,
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // First delete all registrations for this event
    await EventRegistration.deleteMany({ eventId });

    // Then delete the event
    const deletedEvent = await Event.findOneAndDelete({ eventId });

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event and all related registrations deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single event
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({ eventId: req.params.eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this to adminController.js
exports.approveRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Find the registration
    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check if already approved
    if (registration.status === 'approved') {
      return res.status(400).json({ message: 'Registration already approved' });
    }

    // Get the event to check capacity
    const event = await Event.findOne({ eventId: registration.eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check capacity
    const registrationsCount = await EventRegistration.countDocuments({ 
      eventId: registration.eventId, 
      status: 'approved' 
    });
    
    if (registrationsCount + registration.numberOfGuests + 1 > event.capacity) {
      return res.status(400).json({ message: 'Approval would exceed event capacity' });
    }

    // Generate random 6-digit code
    const registrationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update registration
    registration.status = 'approved';
    registration.registrationCode = registrationCode;
    registration.qrGenerated = true;
    await registration.save();

    // Add user to registeredUsers array in Event
    await Event.updateOne(
      { eventId: registration.eventId },
      { $addToSet: { registeredUsers: registration.username } }
    );

    res.json({ message: 'Registration approved', registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// In your adminController.js
exports.getPendingRegistrations = async (req, res) => {
  try {
    const { eventId } = req.query;
    const query = { status: 'pending' };
    
    if (eventId && eventId !== 'all') {
      query.eventId = eventId;
    }

    const registrations = await EventRegistration.find(query)
      .populate('event', 'name date startTime endTime location imageUrl isPaid')
      .sort({ createdAt: -1 });
    
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getApprovedRegistrations = async (req, res) => {
  try {
    const { eventId } = req.query;
    const query = { status: 'approved' };
    
    if (eventId && eventId !== 'all') {
      query.eventId = eventId;
    }

    const registrations = await EventRegistration.find(query)
      .populate('event', 'name date startTime endTime location imageUrl isPaid')
      .sort({ createdAt: -1 });
    
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// adminController.js
exports.verifyRegistration = async (req, res) => {
  try {
    const { username, registrationCode, eventId } = req.body;

    // Basic validation
    if (!username || !registrationCode || !eventId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Find the registration without logging errors
    const registration = await EventRegistration.findOne({
      username,
      registrationCode,
      eventId,
      status: 'approved'
    }).populate('event', 'name date startTime endTime location').lean();

    if (!registration) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid ticket or registration not approved' 
      });
    }

    // Check if event has already happened
    const eventDate = new Date(registration.event.date);
    const now = new Date();
    if (eventDate < now) {
      return res.status(400).json({ 
        success: false,
        message: 'This event has already occurred' 
      });
    }

    // Successful verification
    return res.json({ 
      success: true,
      message: 'Registration verified', 
      registration 
    });

  } catch (error) {
    // Return error response without logging to console
    return res.status(500).json({ 
      success: false,
      message: 'Ticket verification failed' 
    });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find the admin by ID
    const admin = await Admin.findById(decoded.id).select('Username role _id');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({
      id: admin._id,
      username: admin.Username,
      role: admin.role,
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//22may changes
// Fetch approved online orders for cooks (no deliverymanId required)
exports.getApprovedOnlineOrdersForCook = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await OnlineOrder.find({
      order_status: { $in: ["approved"] },
      payment_status: { $ne: "paid" },
      deliverymanId: null, // Only show orders without deliveryman assigned
      order_time: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    })
      .populate("deliverymanId", "Username mobile_no")
      .sort({ order_time: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching approved online orders for cook:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Stream approved online orders for cooks (no deliverymanId required)
exports.streamApprovedOnlineOrdersForCook = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const heartbeatInterval = setInterval(() => {
    res.write(":\n\n");
  }, 30000);

  const sendOrderUpdate = async (order) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(order.order_time);

    if (
      order.isOnlineOrder &&
      (order.order_status === "approved") &&
      !order.deliverymanId && // Only include orders without deliveryman
      orderDate >= today &&
      orderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    ) {
      const populatedOrder = await OnlineOrder.findOne({ order_id: order.order_id })
        .populate("deliverymanId", "Username mobile_no")
        .lean();
      res.write(`data: ${JSON.stringify(populatedOrder)}\n\n`);
    }
  };

  global.onlineOrderEmitter.on("newOrder", sendOrderUpdate);
  global.onlineOrderEmitter.on("orderUpdate", sendOrderUpdate);

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    global.onlineOrderEmitter.off("newOrder", sendOrderUpdate);
    global.onlineOrderEmitter.off("orderUpdate", sendOrderUpdate);
    res.end();
  });
};

exports.getUserCounts = async (req, res) => {
  try {
    const memberCount = await User.countDocuments({ role: 'member' });
    const guestCount = await User.countDocuments({ role: 'guest' });
    
    res.json({
      members: memberCount,
      guests: guestCount,
      total: memberCount + guestCount
    });
  } catch (error) {
    console.error("Error fetching user counts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getGuestUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'guest' }).select('-Password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createGuestUser = async (req, res) => {
  try {
    const { service, Name, Password, mobile_no, email, address } = req.body;

    if (!service || !Name || !Password || !mobile_no || !email || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Generate username: 1 digit service + first 6 digits of mobile + first 4 letters of name + 1
    const mobilePart = mobile_no.replace(/\D/g, '').substring(0, 6); // Take first 6 digits
    const namePart = Name.replace(/\s/g, '').substring(0, 4).toUpperCase(); // Take first 4 letters, no spaces
    const Username = `${service}${mobilePart}${namePart}1`;

    const hashedPassword = await bcrypt.hash(Password, 12);
    const newUser = new User({
      Username,
      Name,
      Password: hashedPassword,
      mobile_no,
      email,
      address,
      role: 'guest',
      service: parseInt(service),
      faculty: 1, // Default value
    });

    await newUser.save();
    const { Password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json({ 
      message: 'Guest user created', 
      user: userWithoutPassword 
    });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ 
        message: 'User with similar details already exists',
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

exports.deleteGuestUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOneAndDelete({ _id: userId, role: 'guest' });
    if (!user) {
      return res.status(404).json({ message: 'Guest user not found' });
    }
    res.json({ message: 'Guest user deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};