const cloudinary = require('cloudinary').v2;
const Upload = require('../models/uploadModel');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: `uploads/${Date.now()}_${req.file.originalname}`,
      },
      async (error, result) => {
        if (error) {
          console.error('Error uploading image:', error);
          return res.status(500).json({ error: 'Error uploading to Cloudinary' });
        }

        // Save image URL and publicId to MongoDB
        const newUpload = new Upload({
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });

        await newUpload.save();

        // Send response with image URL
        return res.status(200).json({ url: result.secure_url });
      }
    );

    req.file.buffer.pipe(uploadStream);
  } catch (error) {
    console.error('Error in upload process:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { uploadImage };
