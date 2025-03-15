import React, { useContext } from 'react';
import { NavLink, Routes, Route } from 'react-router';
import AuthContext from '../context/AuthContext';
import '../themes/dark.css';
import './Menu.css'

function CreateMenu() {
  const buttons = [
    { text: 'Симулятор собеседования', path: '/simulator' },
    { text: 'Практика решения задач', path: '/practice' },
    { text: 'Рекомендации к изучению', path: '/recommendations' },
    { text: 'История собеседований', path: '/history' },
  ];

  return (
    <div id="menu">
      {buttons.map((button, index) => (
        <NavLink
          key={index}
          to={button.path}
          className="button"
        >
          {button.text}
        </NavLink>
      ))}
    </div>
  );
}


function Menu() {
  const { logoutUser } = useContext(AuthContext);

  const handleLogout = async () => {
    logoutUser();
    window.location.href = "/login";
  };

  return (
    <div>
      <CreateMenu />
      <Routes>
        <Route path="/practice" element={<div>Practice</div>} />
        <Route path="/simulator" element={<div>Simulator</div>} />
        <Route path="/history" element={<div>History</div>} />
        <Route path="/recommendations" element={<div>Recommendations</div>} />
      </Routes>
      <button className="logout-button" onClick={handleLogout}>
        Выйти
      </button>
    </div>
  );
}

export default Menu;