require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

console.log("Initializing Cloudinary...");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary Config:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing"
});



// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: async (req, file) => {
//         console.log("📤 Processing file upload:", file.originalname);
//         return {
//             folder: 'uploads',
//             allowedFormats: ['jpeg', 'png', 'jpg'],
//             format: async (req, file) => {
//                 console.log("🖼 File format being set:", file.mimetype);
//                 return 'png';
//             },
            
//             public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
//         };
//     },
// });

// console.log("Cloudinary Storage Initialized");

// module.exports = {
//     storage
// };
export async function handleUpload(file) {
    const res = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
    return res;
  }