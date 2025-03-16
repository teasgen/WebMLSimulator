import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import AuthContext from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { registerUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const result = await registerUser(email, password);
    if (result.success) {
      navigate('/login');
    } else {
      setError(
        typeof result.error === 'object' 
          ? Object.values(result.error).flat().join(' ') 
          : result.error
      );
    }
  };

  return (
    <div id="login">
      <div className="login-text">Регистрация</div>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            className="input-field"
            value={email}
            placeholder='email'
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            className="input-field"
            value={password}
            placeholder='password'
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            className="input-field"
            value={confirmPassword}
            placeholder='confirm password'
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="input-button">
          Зарегистрироваться
        </button>
      </form>
      <button className="input-button" onClick={() => window.location.href = '/login'}>
        Уже есть аккаунт
      </button>
    </div>
  );
  
};

export default Register;
