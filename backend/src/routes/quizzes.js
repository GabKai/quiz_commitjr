const express = require('express');
const router = express.Router();
const {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz
} = require('../controllers/quizController');

router.get('/', listQuizzes);
router.get('/:id', getQuiz);
router.post('/', createQuiz);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);

module.exports = router;
