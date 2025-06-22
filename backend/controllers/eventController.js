const Event = require('../models/Event');
const User = require('../models/User');
const EventRegistration = require('../models/EventRegistration');

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


// Get user's registered events
exports.getUserRegistrations = async (req, res) => {
  try {
    const { username } = req.params;
    const registrations = await EventRegistration.find({ username })
      .populate('event', 'name date startTime endTime location imageUrl')
      .sort({ createdAt: -1 });
    
    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this new controller method
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

// Update the registerForEvent function to set registrationCode to "0" initially
// Register for event
exports.registerForEvent = async (req, res) => {
  try {
    const { username, numberOfGuests = 0, transaction_id } = req.body;
    const { eventId } = req.params;

    // Get the event
    const event = await Event.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already registered
    const existingRegistration = await EventRegistration.findOne({ 
      eventId, 
      username 
    });

    // Handle payment verification for paid events with transaction_id
    if (event.isPaid && transaction_id && existingRegistration) {
      if (existingRegistration.status === 'approved') {
        return res.status(400).json({ message: 'Registration already approved' });
      }

      // Update existing registration with transaction_id, keep status pending
      existingRegistration.transaction_id = transaction_id;
      await existingRegistration.save();

      return res.status(200).json({ 
        message: 'Payment details recorded, awaiting admin approval',
        registration: existingRegistration 
      });
    }

    // Prevent creating new registration if one exists
    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Check capacity
    const registrationsCount = await EventRegistration.countDocuments({ eventId, status: 'approved' });
    if (registrationsCount + numberOfGuests + 1 > event.capacity) {
      return res.status(400).json({ message: 'Event is at full capacity' });
    }

    // Calculate prices
    const totalPrice = event.isPaid 
      ? (event.price || 0) + (numberOfGuests * (event.guest_price || 0))
      : 0;

    if (event.isPaid && !transaction_id) {
      // For paid events, create pending registration and return payment details
      const registration = new EventRegistration({
        eventId,
        event: event._id,
        username,
        registrationCode: "0",
        numberOfGuests,
        eventPrice: event.price || 0,
        guestPrice: event.guest_price || 0,
        totalPrice,
        status: 'pending',
        qrGenerated: false
      });
      await registration.save();

      return res.json({
        paymentRequired: true,
        totalPrice,
        upiId: 'yourbusiness@upi', // Replace with actual UPI ID
        message: 'Please complete payment to register',
        registrationId: registration._id
      });
    }

    // Create registration for free events
    const registration = new EventRegistration({
      eventId,
      event: event._id,
      username,
      registrationCode: Math.floor(100000 + Math.random() * 900000).toString(),
      numberOfGuests,
      eventPrice: event.price || 0,
      guestPrice: event.guest_price || 0,
      totalPrice,
      status: 'approved',
      qrGenerated: true
    });

    await registration.save();

    // Add user to registeredUsers array for free events
    await Event.updateOne(
      { eventId },
      { $addToSet: { registeredUsers: username } }
    );

    res.status(201).json({
      message: 'Registration successful',
      registration
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};