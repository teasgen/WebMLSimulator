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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const navigateToTasks = () => {
    navigate("/practice");
  };

  const handleValidationLLMStreamingResponse = async (prompt) => {
    setSystemAnswer('Validating answer...');

    let localInterviewText = '';
    try {
      const reader = await getLLMResponse(prompt);
      const decoder = new TextDecoder('utf-8');
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let current_str = decoder.decode(value, { stream: true }).trim();
        if (current_str.includes("<|im_end|>"))
            current_str = current_str.slice(0, current_str.indexOf("<|im_end|>"))
        console.log(current_str, current_str.includes("Комментарий"))
        if (current_str.includes("Комментарий"))
          current_str = "\n\n" + current_str;
        current_str = current_str.replace("{", "").replace("}", "").replace(/"/g, "");
        localInterviewText += current_str + " ";
        setSystemAnswer(localInterviewText);
      }
      return { "interviewText": localInterviewText};
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const validateAnswer = async () => {
    setIsSubmitting(true);
    const data = {
      "prompt": "{" + "\"Вопрос\": " + taskText + ", \"Ответ пользователя\": " + answerText + "}",
      "system_prompt_type": 1,
    };

    console.log("send answer to server")
    const result = await handleValidationLLMStreamingResponse(data);
    setIsSubmitting(false);
    return { "answer": result.interviewText };
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
            rows={20}
            placeholder="Bla-bla"
          />

          <h2 className="text">Комментарий проверяющей системы</h2>
          <textarea
            className="input-textarea"
            value={systemAnswer}
            rows={20}
            placeholder="Bla-bla"
            readOnly
          />
        </div>

        <div className="button-panel">
          <button className="submit-button" onClick={validateAnswer} disabled={isSubmitting}>
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