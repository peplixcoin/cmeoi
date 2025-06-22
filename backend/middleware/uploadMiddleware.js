const multer = require('multer');
const path = require('path');

// Configure storage for multer (temporary storage before uploading to Cloudinary)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure 'uploads/' directory exists at your project root
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB file size limit
});

// Middleware to handle multiple files (e.g., up to 5 for 'photos')
// 'photos' should match the field name in your form data
const uploadLoungePhotos = upload.array('photos', 5); // Max 5 photos

module.exports = { uploadLoungePhotos };