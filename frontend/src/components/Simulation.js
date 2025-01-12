import React, { useState } from 'react';
import './Simulation.css';
import '../themes/dark.css';

const Simulation = () => {
  const [interviewText, setInterviewText] = useState('');
  const [answerText, setAnswerText] = useState('');
  
  return (
    <div className="body">
      <div className="main-content">
        <div className="left-panel">
          <h2>Интервьюер</h2>
          <textarea
            className="interview-textarea"
            value={interviewText}
            onChange={(e) => setInterviewText(e.target.value)}
            rows={10}
            placeholder="Bla-bla"
          />

          <h2>Поле для ответа</h2>
          <textarea
            className="answer-textarea"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={50}
            placeholder="Bla-bla"
          />
        </div>

        <div className="right-panel">
          <div className="profile-section">
            <div className="avatar-container">
              <img src="/avatar-placeholder.png" alt="Profile" className="avatar" />
            </div>
            
            <div className="time-display">
              15:35
            </div>

            <button className="submit-button">
              Завершить ответ
            </button>
          </div>
        </div>
      </div>

      <button className="exit-button">
        Выйти
      </button>
    </div>
  );
};

export default Simulation;