const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

// POST /api/questions/:id/image — Upload de imagem
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const questionId = req.params.id;
    const imageUrl = `questions/${req.file.filename}`;

    // Remove imagem anterior se existir
    const [questions] = await pool.query('SELECT image_url FROM questions WHERE id = ?', [questionId]);
    if (questions.length === 0) {
      // Remove arquivo enviado
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Pergunta não encontrada' });
    }

    if (questions[0].image_url) {
      const oldPath = path.join(__dirname, '..', '..', 'uploads', questions[0].image_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Atualiza no banco
    await pool.query('UPDATE questions SET image_url = ? WHERE id = ?', [imageUrl, questionId]);

    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
};

// DELETE /api/questions/:id/image — Remove imagem
const deleteImage = async (req, res) => {
  try {
    const questionId = req.params.id;

    const [questions] = await pool.query('SELECT image_url FROM questions WHERE id = ?', [questionId]);
    if (questions.length === 0) {
      return res.status(404).json({ error: 'Pergunta não encontrada' });
    }

    if (questions[0].image_url) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', questions[0].image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query('UPDATE questions SET image_url = NULL WHERE id = ?', [questionId]);
    res.json({ message: 'Imagem removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover imagem:', error);
    res.status(500).json({ error: 'Erro ao remover imagem' });
  }
};

// PUT /api/questions/:id — Atualiza uma pergunta
const updateQuestion = async (req, res) => {
  try {
    const { question_text, time_limit, points, options } = req.body;
    const questionId = req.params.id;

    const [existing] = await pool.query('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Pergunta não encontrada' });
    }

    await pool.query(
      'UPDATE questions SET question_text = ?, time_limit = ?, points = ? WHERE id = ?',
      [question_text, time_limit || 20, points || 1000, questionId]
    );

    // Recria opções se fornecidas
    if (options && options.length > 0) {
      await pool.query('DELETE FROM options WHERE question_id = ?', [questionId]);
      for (let j = 0; j < options.length; j++) {
        const opt = options[j];
        await pool.query(
          'INSERT INTO options (question_id, option_text, is_correct, color_index) VALUES (?, ?, ?, ?)',
          [questionId, opt.option_text, opt.is_correct ? 1 : 0, j]
        );
      }
    }

    res.json({ message: 'Pergunta atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar pergunta:', error);
    res.status(500).json({ error: 'Erro ao atualizar pergunta' });
  }
};

// DELETE /api/questions/:id — Remove uma pergunta
const deleteQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;

    // Remove imagem se existir
    const [questions] = await pool.query('SELECT image_url FROM questions WHERE id = ?', [questionId]);
    if (questions.length > 0 && questions[0].image_url) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', questions[0].image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const [result] = await pool.query('DELETE FROM questions WHERE id = ?', [questionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pergunta não encontrada' });
    }

    res.json({ message: 'Pergunta removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover pergunta:', error);
    res.status(500).json({ error: 'Erro ao remover pergunta' });
  }
};

module.exports = { uploadImage, deleteImage, updateQuestion, deleteQuestion };
