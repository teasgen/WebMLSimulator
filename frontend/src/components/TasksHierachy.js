import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router";
import './TasksHierachy.css';
import '../themes/dark.css';

import { useNavigateToMenu }  from './common';

function App() {
  const [topics, setTopics] = useState([]);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const navigateToMenu = useNavigateToMenu();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/tasks-getter/');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();

        // Transform the data into the desired format
        const categorizedTopics = data.reduce((acc, item) => {
          const categoryIndex = acc.findIndex(t => t.title === item.category);
          const taskData = { task: item.task, answer: item.answer };
          if (categoryIndex !== -1) {
            acc[categoryIndex].tasks.push(taskData);
          } else {
            acc.push({ title: item.category, tasks: [taskData] });
          }
          return acc;
        }, []);

        setTopics(categorizedTopics);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const toggleTopic = (index) => {
    setExpandedTopic(expandedTopic === index ? null : index);
  };

  const navigateToTask = (topicTitle, taskData) => {
    navigate("/practice/task", {
      state: {
        topicTitle,
        taskText: taskData.task, 
        gtTaskAnswer: taskData.answer,
      }
    });
  };

  if (loading) {
    return <div className='text'>Loading...</div>;
  }

  if (error) {
    return <div className='text'>Error: {error}</div>;
  }

  const sortedTopics = [...topics].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className='container'>
      <ol>
        {sortedTopics.map((topic, index) => (
          <li key={index} className='middle-text'>
            <h3 onClick={() => toggleTopic(index)}>
              {topic.title}
            </h3>
            {expandedTopic === index && (
              <ul>
                {topic.tasks.map((taskData, taskIndex) => (
                  <li className='small-text' key={taskIndex} onClick={() => navigateToTask(topic.title, taskData)}>
                    {taskData.task}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <button className="to-menu-button" onClick={navigateToMenu}>
        Вернуться в меню
      </button>
    </div>
  );

}

export default App;