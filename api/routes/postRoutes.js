const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const postController = require('../../controllers/postcontroller');
const Post = require('../../models/postModel');

env = require('dotenv').config();

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads', // Cloudinary folder name
        format: async (req, file) => 'png', // supports jpg, png, etc.
        public_id: (req, file) => `${Date.now()}-${file.originalname}`,
    },
});

const upload = multer({ storage });
router.post('/create-post', upload.single('image'), postController.createPost);

router.get('/carpets', async (req, res) => {
  try {
    const { type } = req.query; 
    const carpets = await Post.find(type ? { carpetType: type } : {}); 
    res.status(200).json(carpets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
module.exports = router;
