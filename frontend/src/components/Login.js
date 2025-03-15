import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import AuthContext from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await loginUser(email, password);
    if (success) {
      navigate('/menu');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleRegister = () => {
    window.location.href = "/register";
  };

  return (
    <div id="login">
      <div className="text">Вход</div>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            className="input-field"
            value={email}
            placeholder='email'
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            className="input-field"
            value={password}
            placeholder='password'
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="input-button">
          Войти
        </button>
      </form>
      <button className="input-button" onClick={handleRegister}>
        Регистрация
      </button>
    </div>
  );

};

export default Login;
