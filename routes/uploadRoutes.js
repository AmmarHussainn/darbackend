const express = require('express');
const multer = require('multer');
const {uploadImage} = require('../controllers/uploadcontroller');

const router = express.Router();

// Set up Multer for handling image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), uploadImage);

module.exports = router;
