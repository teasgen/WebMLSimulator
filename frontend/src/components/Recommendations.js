import React, { useState, useEffect, useContext } from 'react';
import "../themes/dark.css"
import './Recommendations.css';
import { getStatsLogsDB } from "../services/ApiService";
import AuthContext from '../context/AuthContext';
import { useNavigateToMenu } from './common';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Recommendations() {
  const { user } = useContext(AuthContext);

  const navigateToMenu = useNavigateToMenu();
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('');

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const filtersList = await getStatsLogsDB({
            "userID": user ? user.id : 0,
            "task_name": "filters",
        });
        setFilters(filtersList || []);
      } catch (err) {
        setFilters([]);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getStatsLogsDB({
          "userID": user ? user.id : 0,
          "task_name": "recommendations",
        });

        const formattedTopics = data.map(([score, theme]) => ({
          score,
          name: theme
        }));
        
        formattedTopics.sort((a, b) => a.score - b.score);
        
        const topTopics = formattedTopics.slice(0, 5);
        
        setTopics(topTopics);
        console.log(selectedFilter);

        const chartRawData = await getStatsLogsDB({
          "userID": user ? user.id : 0,
          "task_name": "graphic",
          "filter_name": selectedFilter
        });
        chartRawData.sort((a, b) => new Date(a[1]) - new Date(b[1]));
        
        const labels = chartRawData.map(([_, day]) => {
          const date = new Date(day);
          return date.toISOString().split('T')[0];
        });
        
        const marks = chartRawData.map(([mark, _]) => mark);
        setChartData({
            labels,
            datasets: [
              {
                label: 'Оценки',
                data: marks,
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                pointBackgroundColor: 'white',
                tension: 0.1,
              },
            ],
          });
            

        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
        console.error("Ошибка при загрузке данных:", err);
      }
    };

    fetchData();
  }, [selectedFilter]);

  const handleBackClick = () => {
    console.log('Возврат в меню');
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectedFilter(value);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        min: 0,
        max: 11,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
          maxRotation: 45,
          minRotation: 45,
        }
      }
    },
    layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 10,
          right: 10
        }
      },    
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: 'white',
        bodyColor: 'white',
      }
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 7,
      },
      line: {
        borderWidth: 2,
      }
    }
  };


  return (
    <div className="app-container">
      <h1 className="main-title">Топ 5 тем необходимых для повторения</h1>
      
      {isLoading ? (
        <div className="loading">Загрузка данных...</div>
      ) : error ? (
        <div className="error">Ошибка: {error}</div>
      ) : (
        <div className="topics-container">
          <ol className="topic-list">
            {topics.map((topic, index) => (
              <li key={index} className="topic-item">
                {topic.name} - {topic.score}
              </li>
            ))}
          </ol>
        </div>
      )}
      
      <h2 className="section-title">Изменение оценок</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Фильтр по теме:&nbsp;</label>
        <select
          value={selectedFilter}
          onChange={handleFilterChange}
          disabled={filters.length === 0}
          style={{ minWidth: 180 }}
        >
          <option value="">Выберите тему</option>
          {filters.map((theme, idx) => (
            <option key={idx} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      </div>
      {isLoading ? (
        <div className="loading">Загрузка графика...</div>
      ) : (
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
      <button className="to-menu-button" onClick={navigateToMenu}>
        Вернуться в меню
      </button>
    </div>
  );
}

export default Recommendations;