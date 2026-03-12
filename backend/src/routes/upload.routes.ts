import express from 'express';
import upload from '../middleware/upload';
import cloudinaryUpload from '../middleware/cloudinaryUpload';

const router = express.Router();

// Example route for uploading an image
router.post('/image', upload.single('image'), cloudinaryUpload, (req, res) => {
  res.status(200).json({ imageUrl: req.body.imageUrl, message: 'Image uploaded successfully!' });
});

export default router;
