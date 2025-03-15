import React, { useState, useEffect, useContext } from 'react';
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
        setHistories(data);
    };
    if (user) {
        fetchData();
    }
  }, [user]);

  
  const getMarkColor = (mark) => {
    if (mark === 0) return '#FF3B30'; // Red for 0
    if (mark >= 7) return '#A4B734';  // Green for 7+
    return '#FFCC00';                 // Yellow for others
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      // Format as "YYYY-MM-DD HH:MM"
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return the original string if parsing fails
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