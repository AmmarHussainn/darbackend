
const express = require('express');
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const postRoutes = require('./routes/postroutes');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const Order = require('./models/orderModel');
const Post = require('./models/postModel');
const cloudinary = require('cloudinary').v2;
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Stores file in memory


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(bodyParser.json());


const SECRET_KEY = process.env.SECRET_KEY || "XKdCZhTVsnyOYoYJ";

// Hardcoded password (ONLY FOR YOU)
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "myCarpet1247$";


// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/uploads', express.static('uploads'));




app.post("/api/login", (req, res) => {
  const { password } = req.body;

  if (password === OWNER_PASSWORD) {
    // Generate JWT Token (valid for 2 hours)
    const token = jwt.sign({ user: "owner" }, SECRET_KEY, { expiresIn: "2h" });
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: "Invalid password" });
});

// ✅ Middleware to Protect Routes
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

app.get("/api/dashboard", verifyToken, (req, res) => {
  res.json({ message: "Welcome to your secure dashboard!" });
});



const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/contact', (req, res) => {
  const { name, email, message, selectedCarpet, phone  ,selectedid} = req.body;

  // **Check if required fields are present**
  if (
    !email ||
    !name ||
    !selectedCarpet?.carpetName ||
    !selectedCarpet?.imageUrl
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  console.log('User Email:', email);
  console.log('Selected Carpet:', selectedCarpet);
   console.log('User Phone:', phone);
   console.log(req.body , "body");
  
  const newOrder = new Order({
    customerName: name,
    customerEmail: email,
    customerPhone: phone || '', 
    selectedCarpet: selectedid,
    carpetName: name,
    message: message || '', 
  });

  newOrder
    .save()
    .then(() => {
      const adminMailOptions = {
        from: email, // User's email
        to: process.env.EMAIL_USER, // Admin's email
        subject: `Inquiry about ${selectedCarpet.carpetName}`,
        text: `Name: ${name}
     Email: ${email}
      Carpet: ${selectedCarpet.carpetName}
      Phone: ${phone},
     Message: ${message || 'No message provided'}`,
        
        attachments: [
          {
            filename: `${selectedCarpet.carpetName}.jpg`, // Use the carpet name as the filename
            path: selectedCarpet.imageUrl, // URL of the image to be attached
            cid: 'carpetImage', // Optional content ID for embedding in HTML email (if needed)
          },
        ],
      };

      const userMailOptions = {
        from: process.env.EMAIL_USER, // Admin's email
        to: email, // User's email
        subject: 'Thank you for your inquiry',
        text: `Hello ${name},

Thank you for reaching out about "${selectedCarpet.carpetName}". We have received your inquiry and will get back to you soon.

Best regards,
Al Dar Carpet`,
      };

      // **Send both emails in parallel**
      Promise.all([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(userMailOptions),
      ])
        .then(() =>
          res
            .status(200)
            .json({ message: 'Emails sent and order saved successfully' })
        )
        .catch((error) => {
          console.error('Email Error:', error);
          res.status(500).json({ message: 'Failed to send emails' });
        });
    })
    .catch((error) => {
      console.error('Database Error:', error);
      res.status(500).json({ message: 'Failed to save order' });
    });
});
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Order.find(); 
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

app.post('/api/generalinquiry', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const mailOptions = {
    from: email, // Sender address (the user's email)
    to: process.env.EMAIL_USER, // Admin email address
    subject: `New Contact Us Message: ${subject}`,
    text: `
      Name: ${name}
      Email: ${email}
      Phone: ${phone}
      Subject: ${subject}
      Message: ${message}
    `,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: 'Failed to send message' });
    } else {
      console.log('Message sent: ' + info.response);
      return res
        .status(200)
        .json({ success: true, message: 'Message sent successfully!' });
    }
  });
});

app.use('/api', postRoutes);


app.delete('/api/carpets/:id', async (req, res) => {
  console.log('Delete request received:', req.params);

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const carpet = await Post.findById(id);
    if (!carpet) {
      return res.status(404).json({ error: 'Carpet not found' });
    }
    let cloudinaryPublicId = carpet.imagePublicId;  
    if (!cloudinaryPublicId && carpet.imageUrl) {
      const urlParts = carpet.imageUrl.split('/');
      cloudinaryPublicId = urlParts.slice(-2).join('/').split('.')[0]; 
    }

    await Post.findByIdAndDelete(id);

    if (cloudinaryPublicId) {
      await cloudinary.uploader.destroy(cloudinaryPublicId);
    }

    res.status(204).send(); 
  } catch (error) {
    console.error('Error deleting carpet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/carpets/:id', upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    console.log(updateData , "Updated");
    
    const existingCarpet = await Post.findById(id);
    if (!existingCarpet) {
      return res.status(404).json({ message: "Carpet not found" });
    }

    console.log(req.body, "req.body"); // Should now contain form fields

    if (req.file) {
      // Upload image if new file is provided
      const uploadResponse = await cloudinary.uploader.upload(req.file.buffer.toString("base64"), {
        folder: "uploads"
      });

      updateData.image = uploadResponse.secure_url;
    }
    console.log(updateData , "Updated3");
    // Update the carpet
    const updatedCarpet = await Post.findByIdAndUpdate(id, updateData, { new: true });
      
    res.json(updatedCarpet);
  } catch (error) {
    console.error("Error updating carpet:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
