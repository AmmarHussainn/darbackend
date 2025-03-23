const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, trim: true, maxlength: 160 },
    category: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    author: { type: String, default: "Admin", trim: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true, maxlength: 160 }, // Max 160 characters
    imageUrl: { type: String, trim: true },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", BlogSchema);
module.exports = Blog;