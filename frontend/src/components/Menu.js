import React from 'react';
import { NavLink, Routes, Route } from 'react-router';
import '../themes/dark.css';

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
  return (
    <div>
      <CreateMenu />
      <Routes>
        <Route path="/practice" element={<div>Practice</div>} />
        <Route path="/simulator" element={<div>Simulator</div>} />
        <Route path="/history" element={<div>History</div>} />
        <Route path="/recommendations" element={<div>Recommendations</div>} />
      </Routes>
    </div>
  );
}

export default Menu;