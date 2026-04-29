# QuizPlay — Contexto de Arquitetura

## 1. Visão Geral

QuizPlay é um sistema de quizzes interativos em tempo real, semelhante ao Kahoot. O projeto roda inteiramente em Docker Compose com 3 serviços: MySQL 8.0, Backend Node.js/Express e Frontend React/Vite.

**Características principais:**
- Sem autenticação — qualquer pessoa cria quizzes e salas
- Alternativas variáveis (2 a 6 por pergunta)
- Avatares gerados via DiceBear API
- Comunicação em tempo real via Socket.io
- Interface em Português do Brasil (pt-BR)

---

## 2. Estrutura de Pastas

```
Kahoot/
├── docker-compose.yml
├── .env
├── .gitignore
│
├── mysql-init/
│   └── init.sql                 # DDL — executado na primeira inicialização
│
├── uploads/
│   └── questions/               # Imagens das questões (volume Docker)
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js            # Express + Socket.io entry point
│       ├── config/
│       │   └── database.js      # Pool de conexão MySQL
│       ├── routes/
│       │   ├── quizzes.js       # CRUD de quizzes (GET, POST, PUT, DELETE)
│       │   └── questions.js     # CRUD de perguntas + upload de imagem
│       ├── controllers/
│       │   ├── quizController.js
│       │   └── questionController.js
│       ├── middleware/
│       │   └── upload.js        # Multer — upload de imagens
│       └── socket/
│           ├── index.js         # Registro de todos os handlers
│           ├── lobbyHandler.js  # create_room, join_room, leave_room
│           └── gameHandler.js   # start_game, submit_answer, time_up, etc.
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              # React Router — rotas host vs player
        ├── index.css            # Design tokens (CSS variables)
        ├── socket.js            # Socket.io client singleton
        ├── pages/
        │   ├── host/
        │   │   ├── Dashboard.jsx
        │   │   ├── CreateQuiz.jsx
        │   │   ├── Lobby.jsx
        │   │   ├── HostGame.jsx
        │   │   ├── RoundResults.jsx
        │   │   └── Podium.jsx
        │   └── player/
        │       ├── JoinGame.jsx
        │       ├── WaitingRoom.jsx
        │       ├── PlayerGame.jsx
        │       └── PlayerFeedback.jsx
        ├── components/
        │   ├── Timer.jsx
        │   ├── BarChart.jsx
        │   ├── QuizCard.jsx
        │   ├── PlayerAvatar.jsx
        │   ├── AnswerButton.jsx
        │   └── PodiumStage.jsx
        └── styles/
            ├── host.css
            ├── player.css
            └── components.css
```

---

## 3. Modelagem do Banco de Dados

### Diagrama ER

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   quizzes    │     │  questions   │     │   options    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │──┐  │ id (PK)      │──┐  │ id (PK)      │
│ title        │  └──│ quiz_id (FK) │  └──│ question_id  │
│ description  │     │ question_text│     │ option_text  │
│ created_at   │     │ image_url    │     │ is_correct   │
│ updated_at   │     │ time_limit   │     │ color_index  │
└──────────────┘     │ points       │     └──────────────┘
                     │ order_index  │
                     └──────────────┘
                           │
┌──────────────┐     ┌─────┴────────┐
│game_sessions │     │player_answers│
├──────────────┤     ├──────────────┤
│ id (PK)      │──┐  │ id (PK)      │
│ quiz_id (FK) │  └──│ game_session │
│ room_code    │     │ player_id    │
│ status       │     │ nickname     │
│ current_q    │     │ question_id  │
│ started_at   │     │ option_id    │
│ finished_at  │     │ response_ms  │
│ created_at   │     │ points_earned│
└──────────────┘     │ answered_at  │
                     └──────────────┘
```

### Tabelas

| Tabela | Descrição | Relação |
|--------|-----------|---------|
| `quizzes` | Quiz com título e descrição | 1:N com questions |
| `questions` | Pergunta com texto, imagem, tempo e pontos | N:1 com quizzes, 1:N com options |
| `options` | Alternativa com texto, cor e flag de correta | N:1 com questions |
| `game_sessions` | Sessão de jogo com código de sala e status | N:1 com quizzes, 1:N com player_answers |
| `player_answers` | Resposta do jogador com tempo e pontuação | N:1 com game_sessions, questions, options |

### Campos Importantes

- **`options.color_index`**: 0-5, atribuído automaticamente pela ordem de criação. Mapeia para cores: `[#E21B3C, #1368CE, #D89E00, #26890C, #B8178C, #FF6B35]`
- **`options.is_correct`**: Apenas UMA alternativa por pergunta deve ter `is_correct = 1`
- **`questions.image_url`**: Caminho relativo no volume (ex: `questions/42_1700000000.jpg`)
- **`game_sessions.room_code`**: 6 caracteres alfanuméricos maiúsculos, gerados aleatoriamente, UNIQUE
- **`player_answers.player_id`**: Socket ID do jogador (identificador único por conexão)

---

## 4. Estratégia de Armazenamento de Imagens

| Aspecto | Detalhe |
|---------|---------|
| **Armazenamento** | Volume Docker mapeado: `./uploads:/app/uploads` |
| **Upload** | `POST /api/questions/:id/image` via Multer (multipart/form-data) |
| **Nomenclatura** | `questions/{questionId}_{timestamp}.{ext}` |
| **Servir** | `express.static('/app/uploads')` → acessível via `http://localhost:3001/uploads/...` |
| **No banco** | Apenas caminho relativo: `questions/42_1700000000.jpg` |
| **No frontend** | URL completa: `${API_URL}/uploads/${image_url}` |
| **Formatos aceitos** | JPEG, PNG, GIF, WebP |
| **Tamanho máximo** | 5MB por imagem |

---

## 5. Avatares dos Jogadores

| Aspecto | Detalhe |
|---------|---------|
| **API** | DiceBear v9 — `https://api.dicebear.com/9.x/bottts/svg?seed={nickname}` |
| **Estilo** | `bottts` (robozinhos coloridos) |
| **Determinístico** | Mesmo nickname → mesmo avatar sempre |
| **Uso** | `<img>` direto no lobby, pódio, feedback do jogador |
| **Fallback** | Iniciais do nickname em círculo colorido (caso offline) |

---

## 6. Eventos Socket.io

### Fluxo Completo

```
LOBBY                          JOGO                           RESULTADOS
─────                          ────                           ──────────
create_room ──→                start_game ──→                 show_results ──→
room_created ←──               game_started ←──               round_results ←── (Host)
                               send_question ←──              round_feedback ←── (Player)
join_room ──→                  submit_answer ──→
joined_success ←──             answer_received ←──            show_podium ──→
player_joined ←── (Host)       answer_count_update ←── (Host) podium_data ←──
                               time_up ←──
leave_room ──→                                                next_question ──→
player_left ←── (Host)                                        end_game ──→
                                                              game_ended ←──
```

### Detalhamento dos Eventos

#### Fase: Lobby

| Evento | Emissor | Receptor | Payload |
|--------|---------|----------|---------|
| `create_room` | Host | Server | `{ quizId: number }` |
| `room_created` | Server | Host | `{ roomCode: string, quizTitle: string }` |
| `join_room` | Player | Server | `{ roomCode: string, nickname: string }` |
| `joined_success` | Server | Player | `{ roomCode: string, nickname: string }` |
| `player_joined` | Server | Host | `{ playerId: string, nickname: string, totalPlayers: number }` |
| `leave_room` | Player | Server | `{}` |
| `player_left` | Server | Host | `{ playerId: string, nickname: string, totalPlayers: number }` |

#### Fase: Jogo

| Evento | Emissor | Receptor | Payload |
|--------|---------|----------|---------|
| `start_game` | Host | Server | `{ roomCode: string }` |
| `game_started` | Server | All | `{ questionIndex: number, totalQuestions: number }` |
| `send_question` | Server | Host | `{ question: { id, text, imageUrl, options: [{id, text, colorIndex}], timeLimit, points }, questionIndex, totalQuestions }` |
| `send_question` | Server | Player | `{ questionText: string, options: [{id, colorIndex}], timeLimit: number, questionIndex: number }` |
| `submit_answer` | Player | Server | `{ roomCode: string, optionId: number, responseTimeMs: number }` |
| `answer_received` | Server | Player | `{ status: "ok" }` |
| `answer_count_update` | Server | Host | `{ answeredCount: number, totalPlayers: number }` |
| `time_up` | Server | All | `{ questionIndex: number }` |

> **Nota:** O `send_question` envia dados diferentes para Host e Player. O Player NÃO recebe `option_text` nem `is_correct`, apenas os IDs e cores para exibir os botões.

#### Fase: Resultados

| Evento | Emissor | Receptor | Payload |
|--------|---------|----------|---------|
| `show_results` | Host | Server | `{ roomCode: string }` |
| `round_results` | Server | Host | `{ correctOptionId: number, votes: [{optionId, count}], scores: [{nickname, pointsEarned, totalPoints}] }` |
| `round_feedback` | Server | Player | `{ correct: boolean, pointsEarned: number, totalPoints: number, correctOptionId: number }` |
| `show_podium` | Host | Server | `{ roomCode: string }` |
| `podium_data` | Server | Host | `{ rankings: [{nickname, totalPoints, position}] }` |
| `next_question` | Host | Server | `{ roomCode: string }` |
| `end_game` | Host | Server | `{ roomCode: string }` |
| `game_ended` | Server | Host | `{ finalRankings: [{nickname, totalPoints, position}] }` |
| `game_ended` | Server | Player | `{ position: number, totalPoints: number, nickname: string }` |

---

## 7. Lógica de Pontuação

```
SE acertou:
    pontosGanhos = Math.round(pontosBase × (1 - tempoResposta / tempoLimite × 0.5))
SENÃO:
    pontosGanhos = 0
```

| Cenário | Fórmula | Resultado |
|---------|---------|-----------|
| Acertou em 0s (base 1000, limite 20s) | `1000 × (1 - 0/20 × 0.5)` | **1000 pts** |
| Acertou em 5s (base 1000, limite 20s) | `1000 × (1 - 5/20 × 0.5)` | **875 pts** |
| Acertou em 10s (base 1000, limite 20s) | `1000 × (1 - 10/20 × 0.5)` | **750 pts** |
| Acertou no limite (base 1000, limite 20s) | `1000 × (1 - 20/20 × 0.5)` | **500 pts** |
| Errou ou não respondeu | — | **0 pts** |

---

## 8. Cores das Alternativas

| Index | Cor | Hex | Ícone Geométrico |
|-------|-----|-----|-------------------|
| 0 | Vermelho | `#E21B3C` | ▲ Triângulo |
| 1 | Azul | `#1368CE` | ◆ Losango |
| 2 | Amarelo | `#D89E00` | ● Círculo |
| 3 | Verde | `#26890C` | ■ Quadrado |
| 4 | Rosa | `#B8178C` | ★ Estrela |
| 5 | Laranja | `#FF6B35` | ⬡ Hexágono |

As cores são atribuídas automaticamente com base na ordem da alternativa (0 = primeira, 1 = segunda, etc.).

---

## 9. Rotas da API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/quizzes` | Lista todos os quizzes |
| `GET` | `/api/quizzes/:id` | Detalhes de um quiz (com perguntas e opções) |
| `POST` | `/api/quizzes` | Cria um novo quiz |
| `PUT` | `/api/quizzes/:id` | Atualiza um quiz |
| `DELETE` | `/api/quizzes/:id` | Remove um quiz |
| `POST` | `/api/quizzes/:id/questions` | Adiciona pergunta a um quiz |
| `PUT` | `/api/questions/:id` | Atualiza uma pergunta |
| `DELETE` | `/api/questions/:id` | Remove uma pergunta |
| `POST` | `/api/questions/:id/image` | Upload de imagem para uma pergunta |
| `DELETE` | `/api/questions/:id/image` | Remove imagem de uma pergunta |
| `GET` | `/uploads/*` | Serve arquivos estáticos (imagens) |
