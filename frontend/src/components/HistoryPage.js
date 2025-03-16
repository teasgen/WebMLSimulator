import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from "react-router";
import { getLogsDB } from "../services/ApiService";
import { useNavigateToMenu } from './common';
import AuthContext from '../context/AuthContext';
import './Simulation.css';
import './HistoryPage.css';
import '../themes/dark.css';

function SingleHistory() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { startTime } = location.state || {};
  const uniqueThemes = useRef(null);

  const [results, setResults] = useState([]);
  const [averageMark, setAverageMark] = useState(0);
  const navigateToMenu = useNavigateToMenu();

  useEffect(() => {
    const fetchData = async () => {
        const data = await getLogsDB({
            "userID": user ? user.id : 0,
            "start_time": startTime,
        });
        setResults(data);

        const sum = data.reduce((acc, item) => acc + item.mark, 0);
        setAverageMark((sum / data.length).toFixed(1).trim());

        const uniqueThemesSet = new Set(data.map(item => item.theme));
        uniqueThemes.current = Array.from(uniqueThemesSet);
    };
    fetchData();
  }, []);

  return (
    <div className="container">
      <div className="main-content">
        <div className="text-panel">
          <div className="header-section">
            <h1 className="text">История собеседования</h1>
          </div>

          <div className="results-container">
            {results.map((item, index) => (
              <div className="result-tile" key={index}>
                <div className="middle_text">
                  {index + 1} блок вопрос-ответ:
                </div>
                <div className="block-content">
                  <p className="small_text">&gt; Вопрос: {item.question}</p>
                  <p className="small_text">&gt; Ответ: {item.answer}</p>
                  {item.comment && (
                    <>
                      <p className="small_text">&gt; Комментарий:</p>
                      <p className="small_text">{item.comment}</p>
                    </>
                  )}
                  <div className="mark-section">
                    <p className="small_text">&gt; Оценка:</p>
                    <p className="small_text">{item.mark}/10</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="sidebar">
          <div className="average-mark-container">
            <h2 className="middle_text">Оценка</h2>
            <div className="mark-circle">
              <span className="text">{averageMark}</span>
            </div>
            <div className="topics-section">
              <h3 className="small_text">Затронутые темы</h3>
              <ul className="small_text">
                {uniqueThemes.current && uniqueThemes.current.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <button className="to-menu-button" onClick={navigateToMenu}>Вернуться в меню</button>
    </div>
  );
}

export default SingleHistory;