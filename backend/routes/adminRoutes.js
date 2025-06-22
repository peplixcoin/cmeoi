const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Replace the existing stream route with these two separate routes
router.get('/orders/stream', adminController.streamDineOrders);
router.get('/orders/online/stream', adminController.streamOnlineOrders);

router.post('/login', adminController.loginAdmin);

router.patch('/menu/:id/availability', adminController.updateMenuAvailability);

router.post('/addmenu', adminController.uploadMiddleware, adminController.addMenuItem);

router.delete('/deletemenu/:itemId', adminController.deleteMenuItem);

// New route for updating a menu item
router.put('/menu/:itemId', adminController.uploadMiddleware, adminController.updateMenuItem);

// Orders Management
router.get('/orders', adminController.getAllOrders); 
router.patch('/orders/:orderId/status', adminController.updateOrderStatus);
router.patch('/orders/online/:orderId/status', adminController.updateOnlineOrderStatus);
router.patch('/orders/:orderId/payment', adminController.updatePaymentStatus);
router.patch('/orders/online/:orderId/payment', adminController.updateOnlinePaymentStatus);
router.patch('/orders/:orderId/edit', adminController.editOrder);
router.get('/orders/today', adminController.getTodaysOrders);
router.get('/orders/online/today', adminController.getTodaysOnlineOrders);
router.get('/orders/month/:month', adminController.getMonthlyOrders); 
router.get('/orders/online/month/:month', adminController.getMonthlyOnlineOrders); 

// Cook-specific routes
router.get('/orders/approved', adminController.getApprovedOrders);
router.get('/orders/online/approved', adminController.getApprovedOnlineOrders);
router.get('/orders/approved/stream', adminController.streamApprovedOrders);
router.get('/orders/online/approved/stream', adminController.streamApprovedOnlineOrders);

// New route for fetching orders by specific date
router.get('/orders/date/:date', adminController.getOrdersByDate);
router.get('/orders/online/date/:date', adminController.getOnlineOrdersByDate);

// Add this route with the others
router.get('/orders/current-month', adminController.getCurrentMonthOrders);
router.get('/orders/online/current-month', adminController.getCurrentMonthOnlineOrders);

router.get('/feedback/dine/all', adminController.getAllFeedbacks);
router.get('/feedback/online/all', adminController.getAllOnlineFeedbacks);

// Delivery management routes
router.get('/deliverymen', adminController.getAllDeliveryMen);
router.post('/deliverymen', adminController.createDeliveryMan);
router.patch('/deliverymen/:deliverymanId', adminController.updateDeliveryMan);
router.delete('/deliverymen/:deliverymanId', adminController.deleteDeliveryMan);
// New route for assigning delivery man
router.patch('/orders/online/:orderId/assign-delivery', adminController.assignDeliveryMan);

// Add this to adminRoutes.js
router.get('/events/pending-registrations', adminController.getPendingRegistrations);
// Add this to adminRoutes.js
router.get('/events/approved-registrations', adminController.getApprovedRegistrations);

// adminRoutes.js
router.post('/events/verify-registration', adminController.verifyRegistration);

// Add to existing routes in adminRoutes.js
router.get('/orders/online/approved/cook', adminController.getApprovedOnlineOrdersForCook);
router.get('/orders/online/approved/cook/stream', adminController.streamApprovedOnlineOrdersForCook);

router.get('/users/count', adminController.getUserCounts);
router.get('/me', adminController.getAdminProfile);


router.get('/guest', adminController.getGuestUsers);
router.post('/guest', adminController.createGuestUser);
router.delete('/guest/:userId', adminController.deleteGuestUser);

module.exports = router;