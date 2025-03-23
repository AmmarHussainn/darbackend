const express = require("express");
const Blog = require("../models/blogModel");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for file uploads
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage });

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

// CORS
router.use(cors());

// Validation rules for creating/updating a blog
const blogValidationRules = [
  body("title").notEmpty().withMessage("Title is required"),
  body("content").notEmpty().withMessage("Content is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("metaTitle").notEmpty().withMessage("Meta title is required"),
  body("metaDescription")
    .notEmpty()
    .withMessage("Meta description is required")
    .isLength({ max: 160 })
    .withMessage("Meta description must be 160 characters or less"),
  body("slug").notEmpty().withMessage("Slug is required"),
];

// 📌 CREATE a new blog with image upload to Cloudinary
router.post("/", upload.single("image"), blogValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, category, tags, author, metaTitle, metaDescription, slug } = req.body;

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    let imageUrl = "";

    // Upload image to Cloudinary if file is provided
    if (req.file) {
      // Validate file size and type
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "File size must be less than 5MB" });
      }
      if (!req.file.mimetype.startsWith("image")) {
        return res.status(400).json({ error: "File must be an image" });
      }

      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "blog_images",
          resource_type: "auto",
        }
      );
      imageUrl = result.secure_url;
    }

    // Create new blog
    const newBlog = new Blog({
      title,
      content,
      category,
      tags: tags.split(","),
      author,
      metaTitle,
      metaDescription: metaDescription.substring(0, 160),
      slug,
      imageUrl,
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 GET all blogs with filters & pagination
router.get("/", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    let filter = {};

    // Apply filters
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: "i" };

    // Fetch blogs with pagination
    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total number of blogs
    const totalBlogs = await Blog.countDocuments(filter);

    res.status(200).json({
      blogs,
      totalBlogs,
      totalPages: Math.ceil(totalBlogs / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 GET a single blog by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json(blog);
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 UPDATE a blog by slug
router.put("/:slug", upload.single("image"), blogValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { slug } = req.params;
    const { title, content, category, tags, author, metaTitle, metaDescription, newSlug } = req.body;

    // Check if new slug already exists
    if (newSlug && newSlug !== slug) {
      const existingBlog = await Blog.findOne({ slug: newSlug });
      if (existingBlog) {
        return res.status(400).json({ error: "Slug must be unique" });
      }
    }

    // Find the blog to update
    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Update fields
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    blog.tags = tags ? tags.split(",") : blog.tags;
    blog.author = author || blog.author;
    blog.metaTitle = metaTitle || blog.metaTitle;
    blog.metaDescription = metaDescription ? metaDescription.substring(0, 160) : blog.metaDescription;
    blog.slug = newSlug || blog.slug;

    // Update image if a new one is provided
    if (req.file) {
      // Validate file size and type
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "File size must be less than 5MB" });
      }
      if (!req.file.mimetype.startsWith("image")) {
        return res.status(400).json({ error: "File must be an image" });
      }

      // Delete the old image from Cloudinary
      if (blog.imageUrl) {
        const publicId = blog.imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`blog_images/${publicId}`);
      }

      // Upload the new image
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "blog_images",
          resource_type: "auto",
        }
      );
      blog.imageUrl = result.secure_url;
    }

    // Save the updated blog
    await blog.save();
    res.status(200).json(blog);
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 DELETE a blog by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the blog
    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Delete the image from Cloudinary
    if (deletedBlog.imageUrl) {
      const publicId = deletedBlog.imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`blog_images/${publicId}`);
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = router;