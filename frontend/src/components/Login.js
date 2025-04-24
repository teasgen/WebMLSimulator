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

    const result = await loginUser(email, password);
    console.log(result);
    if (result === true) {
      console.log('Login successful, navigating to menu');
      navigate('/menu');
    } else if (result && result.error === 'email_unverified') {
      setError('Email is not verified');
    } else {
      console.log('Login failed, showing error message');
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleRegister = () => {
    window.location.href = "/register";
  };

  const handleForgotPassword = () => {
    window.location.href = "/forgot-password";
  };

  return (
    <div id="login">
      <div className="login-text">Вход</div>
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
      <button className="input-button" onClick={handleForgotPassword}>
        Забыл пароль
      </button>
    </div>
  );

};

export default Login;
