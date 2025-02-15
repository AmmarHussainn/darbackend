const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure Cloudinary with your credentials from the environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for file storage (we'll use in-memory storage for this example)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API Route handler for file upload
module.exports = (req, res) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'Error uploading image' });
    }

    // Cloudinary image upload
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',  // Automatically detect file type (image, video, etc.)
        public_id: `uploads/${Date.now()}_${path.basename(req.file.originalname)}`,
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Error uploading to Cloudinary' });
        }
        return res.status(200).json({ url: result.secure_url });  // Return the uploaded image URL
      }
    ).end(req.file.buffer);
  });
};
