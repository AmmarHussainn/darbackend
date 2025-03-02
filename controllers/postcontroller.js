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

// const createPost = async (req, res) => {
  
//   try {
//     console.log("0")
    
//     const { carpetName,  carpetType, subCategory  } = req.body;
//     console.log("1")
    
//     if (!carpetName || !carpetType) {
//       return res.status(400).json({ message: 'carpetName and carpetType are required' });
//     }

//     const imageUrl = req.file ? req.file.path : undefined;
//     const parsedSubCategory = typeof subCategory === 'string' ? subCategory : JSON.stringify(subCategory);

//     console.log("2")
    
//     const newPost = new Post({
//       carpetName,
//       // description,
//       carpetType,
//       // longdescription: longdescription || '', 
//       imageUrl,
//       subCategory: parsedSubCategory,
//     });
//     console.log("3")

//     const response = await newPost.save();
//     console.log('response : ', response);

//     res.status(201).json({
//       message: 'Post created successfully',
//       data: {
//         _id: newPost._id,
//         carpetName,
//         // description,
//         carpetType,
//         // longdescription,
//         imageUrl,
//         subCategory: parsedSubCategory,
//       },
//     });
//   } catch (error) {
//     console.log('esrsf',error);  
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

const createPost = async (req, res) => {
  try {
    console.log("Creating Post");

    const { carpetName, carpetType, subCategory, imageUrl } = req.body;

    if (!carpetName || !carpetType) {
      return res.status(400).json({ message: 'carpetName and carpetType are required' });
    }

    const parsedSubCategory = typeof subCategory === 'string' ? subCategory : JSON.stringify(subCategory);

    const newPost = new Post({
      carpetName,
      carpetType,
      imageUrl,
      subCategory: parsedSubCategory,
    });

    const response = await newPost.save();
    console.log('Post saved:', response);

    res.status(201).json({
      message: 'Post created successfully',
      data: response,
    });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createPost };


