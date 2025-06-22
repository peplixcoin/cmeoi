const Lounge = require('../models/Lounge');
const Booking = require('../models/Booking');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const moment = require('moment-timezone'); // Import moment-timezone

exports.generateBill = async (req, res) => {
  try {
    const booking = await Booking.findById(req.body._id).populate('lounge', 'name photos cost');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookingStatus !== 'approved') {
      return res.status(400).json({ message: 'Bill can only be generated for approved bookings' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Booking_${booking._id}_Bill.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    const drawRow = (y, label, value, labelX = 50, valueX = 250) => {
      doc.fontSize(11)
        .text(label, labelX, y)
        .text(value, valueX, y);
    };

    // Header
    doc.fontSize(20).text('Lounge Booking Bill', { align: 'center' });
    doc.fontSize(12).text(`Issued on: ${moment().tz('Asia/Kolkata').format('DD/MM/YYYY')}`, { align: 'center' });
    doc.moveDown(2);

    // Booking Details Table
    doc.fontSize(14).text('Booking Details', { underline: true });
    doc.moveDown(0.5);
    let y = doc.y;
    const rowHeight = 18;

    const rows = [
      ['Booking ID', booking._id],
      ['Customer Name', booking.username],
      ['Lounge Name', booking.lounge.name],
      ['Booking Date', moment(booking.bookingDate).tz('Asia/Kolkata').format('DD/MM/YYYY')],
      ['Guests Count', booking.guestsCount],
      ['Booking Status', booking.bookingStatus],
      ['Catering', booking.catering],
      ['Additional Bar Counters', booking.additionalBarCounter],
      ['Additional Waiters', booking.additionalWaiters],
      ['Music', booking.music ? 'Yes' : 'No'],
      ['Occasion', booking.occasion],
      ['Security Deposit', `Rs ${booking.securityDeposit.toLocaleString()}`],
      ['Booking Cost', `Rs ${booking.lounge.cost.toLocaleString()}`],
      ['Total Estimated Cost', `Rs ${booking.totalCost.toLocaleString()}`],
      ['Amount Paid', `Rs ${booking.bookingTotal.toLocaleString()}`],
      ['Transaction ID', booking.transactionId],
      ['Created At', moment(booking.createdAt).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm:ss')],
    ];

    rows.forEach(([label, value]) => {
      drawRow(y, label, value);
      y += rowHeight;
    });

    // Own Arrangements
    y += 20;
    doc.fontSize(14).text('Own Arrangements', 50, y, { underline: true });
    y += rowHeight;
    const ownRows = [
      ['Generator Backup', booking.ownArrangements.generatorBackup ? 'Yes' : 'No'],
      ['Additional Furniture', booking.ownArrangements.additionalFurniture ? 'Yes' : 'No'],
      ['Additional Lighting', booking.ownArrangements.additionalLighting ? 'Yes' : 'No'],
    ];
    ownRows.forEach(([label, value]) => {
      drawRow(y, label, value);
      y += rowHeight;
    });

    // Dignitaries
    y += 20;
    doc.fontSize(14).text('Dignitaries', 50, y, { underline: true });
    y += rowHeight;
    if (!booking.dignitaries || booking.dignitaries.length === 0) {
      doc.fontSize(11).text('No dignitaries listed.', 50, y);
      y += rowHeight;
    } else {
      booking.dignitaries.forEach(d => {
        const dignitary = `${d.rank || 'N/A'} ${d.name} (${d.designation})`;
        doc.fontSize(11).text(dignitary, 50, y);
        y += rowHeight;
      });
    }

    const footerText = 'Thank you for booking with us! For any queries, please contact our support team.';
    const footerHeight = 20;

    if (doc.y + footerHeight + 20 < doc.page.height - doc.page.margins.bottom) {
      doc.moveDown(2);
    } else {
      doc.addPage();
    }

    doc.fontSize(10).text(
      footerText,
      50,
      doc.page.height - doc.page.margins.bottom - footerHeight,
      { align: 'center', width: doc.page.width - 100 }
    );

    doc.end();
  } catch (error) {
    console.error('Bill generation error:', error);
    res.status(500).json({ message: `Bill generation failed: ${error.message}` });
  }
};

exports.getAllLounges = async (req, res) => {
  try {
    const lounges = await Lounge.find();
    res.status(200).json(lounges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLoungeById = async (req, res) => {
  try {
    const lounge = await Lounge.findById(req.params.id);
    if (!lounge) {
      return res.status(404).json({ message: 'Lounge not found' });
    }
    res.status(200).json(lounge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { date } = req.params;
    // Parse the date as IST
    const bookingDate = moment.tz(date, 'YYYY-MM-DD', 'Asia/Kolkata').startOf('day').toDate();
    const bookings = await Booking.find({
      loungeId: req.params.id,
      bookingDate: {
        $gte: moment(bookingDate).startOf('day').toDate(),
        $lte: moment(bookingDate).endOf('day').toDate(),
      },
      bookingStatus: { $in: ['pending', 'approved'] },
    });

    res.status(200).json({ isAvailable: bookings.length === 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const {
      loungeId,
      bookingDate,
      guestsCount,
      catering,
      additionalBarCounter,
      additionalWaiters,
      music,
      occasion,
      securityDeposit,
      bookingTotal,
      totalCost,
      ownArrangements,
      dignitaries,
      transactionId,
      username,
    } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required in request body' });
    }

    // Parse bookingDate as IST and set to start of day
    const parsedBookingDate = moment.tz(bookingDate, 'YYYY-MM-DD', 'Asia/Kolkata').startOf('day').toDate();

    const newBooking = new Booking({
      username,
      loungeId,
      lounge: loungeId,
      bookingDate: parsedBookingDate,
      guestsCount,
      catering,
      additionalBarCounter,
      additionalWaiters,
      music,
      occasion,
      securityDeposit,
      bookingTotal,
      totalCost,
      ownArrangements,
      dignitaries,
      transactionId,
      bookingStatus: 'pending',
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      message: error.message || 'Failed to create booking',
      details: error.errors,
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const username = req.params.username;
    const bookings = await Booking.find({ username }).populate('lounge');
    // Convert booking dates to IST for response
    const formattedBookings = bookings.map(booking => ({
      ...booking._doc,
      bookingDate: moment(booking.bookingDate).tz('Asia/Kolkata').format('YYYY-MM-DD'),
    }));
    res.status(200).json(formattedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ bookingStatus: 'pending' })
      .populate('lounge', 'name photos')
      .sort({ createdAt: -1 });
    const formattedBookings = bookings.map(booking => ({
      ...booking._doc,
      bookingDate: moment(booking.bookingDate).tz('Asia/Kolkata').format('YYYY-MM-DD'),
    }));
    res.status(200).json(formattedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getApprovedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ bookingStatus: 'approved' })
      .populate('lounge', 'name photos')
      .sort({ createdAt: -1 });
    const formattedBookings = bookings.map(booking => ({
      ...booking._doc,
      bookingDate: moment(booking.bookingDate).tz('Asia/Kolkata').format('YYYY-MM-DD'),
    }));
    res.status(200).json(formattedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRejectedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ bookingStatus: 'rejected' })
      .populate('lounge', 'name photos')
      .sort({ createdAt: -1 });
    const formattedBookings = bookings.map(booking => ({
      ...booking._doc,
      bookingDate: moment(booking.bookingDate).tz('Asia/Kolkata').format('YYYY-MM-DD'),
    }));
    res.status(200).json(formattedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { bookingStatus: status },
      { new: true }
    ).populate('lounge', 'name photos');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Format bookingDate for response
    const formattedBooking = {
      ...booking._doc,
      bookingDate: moment(booking.bookingDate).tz('Asia/Kolkata').format('YYYY-MM-DD'),
    };

    res.json(formattedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadImagesToCloudinary = async (files) => {
  const imageUrls = [];
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "lounge_images",
          transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        });
        imageUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error for file:", file.originalname, uploadError);
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    }
  }
  return imageUrls;
};

exports.createLounge = async (req, res) => {
  try {
    const { name, description, capacity, cost, barCounters, waiters } = req.body;
    const uploadedImageUrls = await uploadImagesToCloudinary(req.files);

    const newLounge = new Lounge({
      name,
      description,
      capacity,
      cost,
      barCounters,
      waiters,
      photos: uploadedImageUrls,
    });

    await newLounge.save();
    res.status(201).json(newLounge);
  } catch (error) {
    console.error("Error creating lounge:", error);
    res.status(500).json({ message: error.message || "Failed to create lounge." });
  }
};

exports.updateLounge = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid lounge ID' });
    }

    const existingLounge = await Lounge.findById(id);
    if (!existingLounge) {
      return res.status(404).json({ message: 'Lounge not found' });
    }

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      newImageUrls = await uploadImagesToCloudinary(req.files);
    }

    let finalPhotos = existingLounge.photos || [];
    if (req.body.photos) {
      try {
        finalPhotos = Array.isArray(req.body.photos) ? req.body.photos : JSON.parse(req.body.photos);
      } catch (e) {
        console.warn("Could not parse req.body.photos for update, keeping existing photos if any.");
      }
    }

    if (newImageUrls.length > 0) {
      finalPhotos = [...finalPhotos, ...newImageUrls];
    }

    if (finalPhotos.length > 5) {
      console.warn(`Lounge ${id} now has ${finalPhotos.length} photos, exceeding the typical limit of 5. Consider UI to manage this.`);
    }

    updateData.photos = finalPhotos;

    const updatedLounge = await Lounge.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    res.json(updatedLounge);
  } catch (error) {
    console.error("Error updating lounge:", error);
    res.status(500).json({ message: error.message || "Failed to update lounge." });
  }
};

exports.deleteLounge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid lounge ID' });
    }

    const loungeToDelete = await Lounge.findById(id);
    if (!loungeToDelete) {
      return res.status(404).json({ message: 'Lounge not found' });
    }

    if (loungeToDelete.photos && loungeToDelete.photos.length > 0) {
      for (const imageUrl of loungeToDelete.photos) {
        try {
          const publicId = imageUrl.substring(imageUrl.lastIndexOf('/') + 1, imageUrl.lastIndexOf('.'));
          await cloudinary.uploader.destroy(`lounge_images/${publicId}`);
        } catch (cloudinaryError) {
          console.error("Failed to delete image from Cloudinary:", imageUrl, cloudinaryError);
        }
      }
    }

    await Booking.deleteMany({ loungeId: id });
    await Lounge.findByIdAndDelete(id);

    res.json({ message: 'Lounge, related bookings, and its images deleted successfully' });
  } catch (error) {
    console.error("Error deleting lounge:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getBookedDates = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({
      loungeId: id,
      bookingStatus: { $in: ['pending', 'approved'] },
    }).select('bookingDate -_id');
    
    const bookedDates = bookings.map(booking => 
      moment(booking.bookingDate).tz('Asia/Kolkata').format('YYYY-MM-DD')
    );
    
    res.status(200).json({ bookedDates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};