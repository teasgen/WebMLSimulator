import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router";

import { getLLMResponse } from "../services/ApiService";

import './TaskSolver.css';
import '../themes/dark.css';

function App() {
  const location = useLocation();
  const { topicTitle, taskText, gtTaskAnswer } = location.state || {};
  const [answerText, setAnswerText] = useState('');
  const [systemAnswer, setSystemAnswer] = useState('');

  const navigate = useNavigate();

  const navigateToTasks = () => {
    navigate("/practice");
  };

  const validateAnswer = () => {
    const data = {"prompt": "Вопрос: " + taskText + "\nОтвет: " + answerText};

    getLLMResponse(data)
      .then((answer) => { 
        setSystemAnswer(answer.message);
      })
  };

  return (
    <div className="body">
      <div className="main-content">
        <div className="text-panel">
          <h2 className="text">{taskText}</h2>
          <textarea
            className="input-textarea"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={30}
            placeholder="Bla-bla"
          />

          <h2 className="text">Комментарий проверяющей системы</h2>
          <textarea
            className="input-textarea"
            value={systemAnswer}
            rows={10}
            placeholder="Bla-bla"
            readOnly
          />
        </div>

        <div className="button-panel">
          <button className="submit-button" onClick={validateAnswer}>
            Отправить
          </button>
          <button className="submit-button" onClick={navigateToTasks}>
            Вернуться к задачам
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;