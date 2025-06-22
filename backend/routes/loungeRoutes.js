const express = require('express');
const loungeController = require('../controllers/loungeController');
const { uploadLoungePhotos } = require('../middleware/uploadMiddleware');

const router = express.Router();


// User routes
router.get('/', loungeController.getAllLounges);
router.get('/:id', loungeController.getLoungeById);
router.get('/:id/availability/:date', loungeController.checkAvailability);
router.post('/book', loungeController.createBooking);
router.get('/bookings/:username', loungeController.getUserBookings);
router.post('/generate-bill', loungeController.generateBill);
router.get('/:id/booked-dates', loungeController.getBookedDates);

// Admin routes
router.post('/', uploadLoungePhotos, loungeController.createLounge);
router.put('/:id', uploadLoungePhotos, loungeController.updateLounge);
router.delete('/:id', loungeController.deleteLounge);

router.get('/admin/lounge-bookings/pending', loungeController.getPendingBookings);
router.get('/admin/lounge-bookings/approved', loungeController.getApprovedBookings);
router.get('/admin/lounge-bookings/rejected', loungeController.getRejectedBookings);
router.patch('/admin/lounge-bookings/:id/status', loungeController.updateBookingStatus);

module.exports = router;