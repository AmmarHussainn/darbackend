const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  carpetName: {
    type: String,
    required: true,
  },
  // description: {
  //   type: String,
    
  // },
  // longdescription: {
  //   type: String,
  // },
  carpetType: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  imagePublicId :  {
    type : String,

  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
