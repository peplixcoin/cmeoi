const express = require('express');
const eventController = require('../controllers/eventController');
const adminController = require('../controllers/adminController');


const router = express.Router();

// User routes
router.get('/', eventController.getAllEvents);
router.get('/:eventId', eventController.getEventById);
router.post('/:eventId/register', eventController.registerForEvent);
router.get('/user/:username', eventController.getUserRegistrations);

// Admin routes
router.post('/', adminController.eventUploadMiddleware, adminController.createEvent);
router.put('/:eventId', adminController.eventUploadMiddleware, adminController.updateEvent);
router.delete('/:eventId', adminController.deleteEvent);
router.patch('/registrations/:registrationId/approve', adminController.approveRegistration);



module.exports = router;