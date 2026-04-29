const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// POST /api/upload — Generic image upload
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const imageUrl = `questions/${req.file.filename}`;
    
    // We reuse the "questions" folder configured in the upload middleware
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

module.exports = router;
