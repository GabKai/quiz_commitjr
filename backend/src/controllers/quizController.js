const { pool } = require('../config/database');

// GET /api/quizzes — Lista todos os quizzes
const listQuizzes = async (req, res) => {
  try {
    const [quizzes] = await pool.query(`
      SELECT q.*, COUNT(qn.id) as question_count
      FROM quizzes q
      LEFT JOIN questions qn ON q.id = qn.quiz_id
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `);
    res.json(quizzes);
  } catch (error) {
    console.error('Erro ao listar quizzes:', error);
    res.status(500).json({ error: 'Erro ao listar quizzes' });
  }
};

// GET /api/quizzes/:id — Detalhes de um quiz com perguntas e opções
const getQuiz = async (req, res) => {
  try {
    const [quizzes] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    const quiz = quizzes[0];

    const [questions] = await pool.query(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC',
      [quiz.id]
    );

    for (const question of questions) {
      const [options] = await pool.query(
        'SELECT * FROM options WHERE question_id = ? ORDER BY color_index ASC',
        [question.id]
      );
      question.options = options;
    }

    quiz.questions = questions;
    res.json(quiz);
  } catch (error) {
    console.error('Erro ao buscar quiz:', error);
    res.status(500).json({ error: 'Erro ao buscar quiz' });
  }
};

// POST /api/quizzes — Cria um quiz completo (com perguntas e opções)
const createQuiz = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { title, description, questions } = req.body;

    const [quizResult] = await connection.query(
      'INSERT INTO quizzes (title, description) VALUES (?, ?)',
      [title, description || null]
    );
    const quizId = quizResult.insertId;

    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const [questionResult] = await connection.query(
          'INSERT INTO questions (quiz_id, question_text, image_url, time_limit, points, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [quizId, q.question_text, q.image_url || null, q.time_limit || 20, q.points || 1000, i]
        );
        const questionId = questionResult.insertId;

        if (q.options && q.options.length > 0) {
          for (let j = 0; j < q.options.length; j++) {
            const opt = q.options[j];
            await connection.query(
              'INSERT INTO options (question_id, option_text, image_url, is_correct, color_index) VALUES (?, ?, ?, ?, ?)',
              [questionId, opt.option_text, opt.image_url || null, opt.is_correct ? 1 : 0, j]
            );
          }
        }
      }
    }

    await connection.commit();

    // Retorna o quiz criado
    const [newQuiz] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    res.status(201).json({ ...newQuiz[0], id: quizId });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar quiz:', error);
    res.status(500).json({ error: 'Erro ao criar quiz' });
  } finally {
    connection.release();
  }
};

// PUT /api/quizzes/:id — Atualiza um quiz (recria perguntas e opções)
const updateQuiz = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { title, description, questions } = req.body;
    const quizId = req.params.id;

    // Verifica se existe
    const [existing] = await connection.query('SELECT id FROM quizzes WHERE id = ?', [quizId]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }

    // Atualiza quiz
    await connection.query(
      'UPDATE quizzes SET title = ?, description = ? WHERE id = ?',
      [title, description || null, quizId]
    );

    // Remove perguntas anteriores (cascade remove options)
    await connection.query('DELETE FROM questions WHERE quiz_id = ?', [quizId]);

    // Recria perguntas e opções
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const [questionResult] = await connection.query(
          'INSERT INTO questions (quiz_id, question_text, image_url, time_limit, points, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [quizId, q.question_text, q.image_url || null, q.time_limit || 20, q.points || 1000, i]
        );
        const questionId = questionResult.insertId;

        if (q.options && q.options.length > 0) {
          for (let j = 0; j < q.options.length; j++) {
            const opt = q.options[j];
            await connection.query(
              'INSERT INTO options (question_id, option_text, image_url, is_correct, color_index) VALUES (?, ?, ?, ?, ?)',
              [questionId, opt.option_text, opt.image_url || null, opt.is_correct ? 1 : 0, j]
            );
          }
        }
      }
    }

    await connection.commit();
    res.json({ message: 'Quiz atualizado com sucesso' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar quiz:', error);
    res.status(500).json({ error: 'Erro ao atualizar quiz' });
  } finally {
    connection.release();
  }
};

// DELETE /api/quizzes/:id — Remove um quiz
const deleteQuiz = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM quizzes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Quiz não encontrado' });
    }
    res.json({ message: 'Quiz removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover quiz:', error);
    res.status(500).json({ error: 'Erro ao remover quiz' });
  }
};

module.exports = { listQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz };
