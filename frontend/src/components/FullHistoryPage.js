import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from "react-router";
import { getLogsDB } from "../services/ApiService";
import { useNavigateToMenu } from './common';
import AuthContext from '../context/AuthContext';
import './Simulation.css';
import './FullHistoryPage.css';
import '../themes/dark.css';

function History() {
  const [histories, setHistories] = useState([]);
  const navigate = useNavigate();
  const navigateToMenu = useNavigateToMenu();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    console.log(user)
    const fetchData = async () => {
        const data = await getLogsDB({
            "userID": user ? user.id : 0,
        });
        console.log(data)
        data.sort((a, b) => new Date(b["datetime"]) - new Date(a["datetime"]));
        setHistories(data);
    };
    if (user) {
        fetchData();
    }
  }, [user]);

  
  const getMarkColor = (mark) => {
    const m = Math.max(0, Math.min(10, mark));
  
    // КРАСНЫЙ -> ЖЕЛТЫЙ
    if (m <= 5) {
      // 0 = красный #FF3B30, 5 = желтый #FFCC00
      // Интерполируем от (255,59,48) к (255,204,0)
      const r = 255;
      const g = Math.round(59 + (204-59) * (m/5));
      const b = Math.round(48 + (0-48) * (m/5));
      return `rgb(${r},${g},${b})`;
    }
  
    // ЖЕЛТЫЙ -> ЗЕЛЕНЫЙ
    // 5 = желтый #FFCC00, 10 = зелёный #A4B734
    // от (255,204,0) к (164,183,52)
    const ratio = (m-5)/5;
    const r = Math.round(255 + (164-255)*ratio);
    const g = Math.round(204 + (183-204)*ratio);
    const b = Math.round(0 + (52-0)*ratio);
    return `rgb(${r},${g},${b})`;
  };
  

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const hours = String(date.getHours() - 3).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      // Format as "YYYY-MM-DD HH:MM"
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const navigateToHistory = (datetime) => {
    navigate("/single-history", {
      state: {
        startTime: datetime,
      }
    });
  };

  return (
    <div className="container">
      <div className="history-list">
        {histories.map((item, index) => (
          <div className="history-item" key={index} onClick={() => navigateToHistory(item.datetime)} >
            <div className="history-text">
              История {formatDate(item.datetime)}
            </div>
            <div 
              className="mark-circle"
              style={{ backgroundColor: getMarkColor(item.mark) }}
            >
              {item.mark}
            </div>
          </div>
        ))}
      </div>

      <button className="to-menu-button" onClick={navigateToMenu}>Вернуться в меню</button>
    </div>
  );
}

export default History;