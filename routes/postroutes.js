const express = require('express');
const multer = require('multer');
// const { storage } = require('../storage/storage');
const postController = require('../controllers/postcontroller');
const Post = require('../models/postModel');
const router = express.Router();
const {handleUpload} = require('../helper')

  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  const myUploadMiddleware = upload.single('image');

  function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
      fn(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
  }


  const middleware = async (req, res, next) => {
    try {
      await myUploadMiddleware(req, res, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Multer error", error: err.message });
        }
  
        if (!req.file) {
          return next(); // No file uploaded, continue without setting imageUrl
        }
  
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = `data:${req.file.mimetype};base64,${b64}`;
  
        try {
          const cldRes = await handleUpload(dataURI);
          req.body.imageUrl = cldRes.secure_url; // Attach Cloudinary URL to request body
          next(); // Proceed to the controller
        } catch (uploadError) {
          console.error(uploadError);
          return res.status(500).json({ message: "Cloudinary upload failed", error: uploadError.message });
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  };
  

router.post('/create-post', middleware, postController.createPost);



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
