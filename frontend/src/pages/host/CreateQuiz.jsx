import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/host.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const EMPTY_OPTION = { option_text: '', image_url: null, is_correct: false };
const EMPTY_QUESTION = {
  question_text: '',
  image_url: null,
  time_limit: 20,
  points: 1000,
  options: [
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION }
  ]
};

export default function CreateQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ ...EMPTY_QUESTION, options: EMPTY_QUESTION.options.map(o => ({ ...o })) }]);
  const [saving, setSaving] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchQuiz();
    }
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${id}`);
      const data = await res.json();
      setTitle(data.title);
      setDescription(data.description || '');
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions.map(q => ({
          question_text: q.question_text,
          time_limit: q.time_limit,
          points: q.points,
          image_url: q.image_url,
          options: q.options.map(o => ({
            option_text: o.option_text,
            image_url: o.image_url,
            is_correct: o.is_correct === 1
          }))
        })));
      }
    } catch (err) {
      console.error('Erro ao buscar quiz:', err);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { ...EMPTY_QUESTION, options: EMPTY_QUESTION.options.map(o => ({ ...o })) }]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, field, value) => {
    const updated = [...questions];
    const opts = [...updated[qIndex].options];
    opts[oIndex] = { ...opts[oIndex], [field]: value };

    // Se marcando como correta, desmarca as outras
    if (field === 'is_correct' && value) {
      opts.forEach((o, i) => {
        if (i !== oIndex) {
          opts[i] = { ...opts[i], is_correct: false };
        }
      });
    }

    updated[qIndex] = { ...updated[qIndex], options: opts };
    setQuestions(updated);
  };

  const handleImageUpload = async (file, qIndex, oIndex = null) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Falha ao enviar imagem');
      const data = await res.json();
      
      if (oIndex !== null) {
        updateOption(qIndex, oIndex, 'image_url', data.image_url);
      } else {
        updateQuestion(qIndex, 'image_url', data.image_url);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar imagem. Tente novamente.');
    }
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length >= 6) return;
    updated[qIndex] = {
      ...updated[qIndex],
      options: [...updated[qIndex].options, { ...EMPTY_OPTION }]
    };
    setQuestions(updated);
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) return;
    updated[qIndex] = {
      ...updated[qIndex],
      options: updated[qIndex].options.filter((_, i) => i !== oIndex)
    };
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('Digite um título para o quiz');
    if (questions.some(q => !q.question_text.trim())) return alert('Preencha todas as perguntas');
    if (questions.some(q => q.options.some(o => !o.option_text.trim()))) return alert('Preencha todas as alternativas');
    if (questions.some(q => !q.options.some(o => o.is_correct))) return alert('Marque a alternativa correta em todas as perguntas');

    setSaving(true);
    try {
      const body = { title, description, questions };
      const url = isEditing ? `${API_URL}/api/quizzes/${id}` : `${API_URL}/api/quizzes`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha na resposta do servidor');
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Erro ao salvar quiz:', err);
      alert(`Erro ao salvar o quiz: ${err.message}. Tente novamente.`);
    } finally {
      setSaving(false);
    }
  };

  const ANSWER_COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C', '#B8178C', '#FF6B35'];
  const ANSWER_SHAPES = ['▲', '◆', '●', '■', '★', '⬡'];

  return (
    <div className="create-quiz-page">
      <header className="create-header">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')} id="btn-back">
          ← Voltar
        </button>
        <h1 className="page-title">{isEditing ? 'Editar Quiz' : 'Criar Novo Quiz'}</h1>
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={handleSave}
          disabled={saving}
          id="btn-save-quiz"
        >
          {saving ? 'Salvando...' : '💾 Salvar Quiz'}
        </button>
      </header>

      <main className="create-content">
        <div className="create-form-section glass ghost-border">
          <label className="input-label">Título do Quiz</label>
          <input
            className="input-field"
            type="text"
            placeholder="Ex: Conhecimentos Gerais"
            value={title}
            onChange={e => setTitle(e.target.value)}
            id="input-quiz-title"
          />
          <label className="input-label" style={{ marginTop: 'var(--space-md)' }}>Descrição (opcional)</label>
          <input
            className="input-field"
            type="text"
            placeholder="Uma breve descrição do quiz"
            value={description}
            onChange={e => setDescription(e.target.value)}
            id="input-quiz-description"
          />
        </div>

        <div className="questions-list">
          {questions.map((q, qi) => (
            <div key={qi} className="question-card glass ghost-border animate-fade-in" style={{ animationDelay: `${qi * 0.05}s` }}>
              <div className="question-header">
                <span className="question-number">Pergunta {qi + 1}</span>
                <div className="question-controls">
                  <select
                    className="select-field"
                    value={q.time_limit}
                    onChange={e => updateQuestion(qi, 'time_limit', parseInt(e.target.value))}
                    style={{ width: '120px' }}
                  >
                    <option value={10}>10 seg</option>
                    <option value={15}>15 seg</option>
                    <option value={20}>20 seg</option>
                    <option value={30}>30 seg</option>
                    <option value={45}>45 seg</option>
                    <option value={60}>60 seg</option>
                  </select>
                  {questions.length > 1 && (
                    <button type="button" className="btn btn-danger-ghost" onClick={() => removeQuestion(qi)}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div className="question-image-section">
                {q.image_url ? (
                  <div className="image-preview">
                    <img src={`${API_URL}/uploads/${q.image_url}`} alt="Preview" />
                    <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => updateQuestion(qi, 'image_url', null)}>Remover Imagem</button>
                  </div>
                ) : (
                  <label className="image-upload-btn btn btn-ghost btn-sm">
                    📷 Adicionar Imagem
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], qi)} hidden />
                  </label>
                )}
              </div>

              <textarea
                className="input-field question-textarea"
                placeholder="Digite a pergunta..."
                value={q.question_text}
                onChange={e => updateQuestion(qi, 'question_text', e.target.value)}
                rows={2}
              />

              <div className="options-grid">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className="option-row"
                    style={{ '--option-color': ANSWER_COLORS[oi] }}
                  >
                    <div className="option-color-bar" style={{ backgroundColor: ANSWER_COLORS[oi] }}>
                      <span>{ANSWER_SHAPES[oi]}</span>
                    </div>
                    <div className="option-image-upload">
                      {opt.image_url ? (
                        <div className="option-image-preview">
                          <img src={`${API_URL}/uploads/${opt.image_url}`} alt="Opt Preview" />
                          <button type="button" className="remove-opt-img" onClick={() => updateOption(qi, oi, 'image_url', null)}>✕</button>
                        </div>
                      ) : (
                        <label className="opt-img-btn" title="Adicionar imagem na alternativa">
                          📷
                          <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], qi, oi)} hidden />
                        </label>
                      )}
                    </div>
                    <input
                      className="input-field option-input"
                      placeholder={`Alternativa ${oi + 1}`}
                      value={opt.option_text}
                      onChange={e => updateOption(qi, oi, 'option_text', e.target.value)}
                    />
                    <button
                      type="button"
                      className={`correct-toggle ${opt.is_correct ? 'correct-active' : ''}`}
                      onClick={() => updateOption(qi, oi, 'is_correct', !opt.is_correct)}
                      title={opt.is_correct ? 'Resposta correta' : 'Marcar como correta'}
                    >
                      {opt.is_correct ? '✓' : '○'}
                    </button>
                    {q.options.length > 2 && (
                      <button type="button" className="btn-icon-sm" onClick={() => removeOption(qi, oi)} title="Remover alternativa">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {q.options.length < 6 && (
                <button type="button" className="btn btn-ghost add-option-btn" onClick={() => addOption(qi)}>
                  + Adicionar Alternativa
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-secondary btn-large add-question-btn" onClick={addQuestion} id="btn-add-question">
          + Adicionar Pergunta
        </button>
      </main>
    </div>
  );
}
