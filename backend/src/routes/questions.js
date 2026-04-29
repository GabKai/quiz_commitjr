const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadImage,
  deleteImage,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');

router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);
router.post('/:id/image', upload.single('image'), uploadImage);
router.delete('/:id/image', deleteImage);

module.exports = router;
