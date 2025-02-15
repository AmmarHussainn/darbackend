// const Post = require("../models/postModel");

// const createPost = async (req, res) => {
//   try {
//     const { carpetName, description, carpetType } = req.body;
//     if (!carpetName || !carpetType) {
//       return res.status(400).json({ message: 'carpetName and carpetType are required' });
//     }

//     const imageUrl = req.file ? req.file.path : undefined;  // Only add imageUrl if file is present

//     const newPost = new Post({
//       carpetName,
//       description,
//       carpetType,
//       imageUrl,
//     });
//   const  response =  await newPost.save();
//   console.log('response : ',response);
  
//     res.status(201).json({
//       message: 'Post created successfully',
//       data: {
//         _id: newPost._id,  // Include the _id of the created post
//         carpetName,
//         description,
//         carpetType,
//         imageUrl,
//       },
//     });
//   } catch (error) {
//     console.log(error);  
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// module.exports = { createPost };


const Post = require("../models/postModel");

const createPost = async (req, res) => {
  try {
    const { carpetName, description, carpetType, longdescription } = req.body;
    
    if (!carpetName || !carpetType) {
      return res.status(400).json({ message: 'carpetName and carpetType are required' });
    }

    const imageUrl = req.file ? req.file.path : undefined;

    const newPost = new Post({
      carpetName,
      description,
      carpetType,
      longdescription: longdescription || '', 
      imageUrl,
    });

    const response = await newPost.save();
    console.log('response : ', response);

    res.status(201).json({
      message: 'Post created successfully',
      data: {
        _id: newPost._id,
        carpetName,
        description,
        carpetType,
        longdescription,
        imageUrl,
      },
    });
  } catch (error) {
    console.log(error);  
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createPost };
