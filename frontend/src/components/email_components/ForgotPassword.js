import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import AuthContext from '../../context/AuthContext';
import '../Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { requestPasswordReset } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email обязателен');
      return;
    }

    const result = await requestPasswordReset(email);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error);
    }
  };

  return (
    <div id="login">
      <h2 className="login-text">Восстановление пароля</h2>
      
      {submitted ? (
        <div>
          <p className='small_text'>Письмо с инструкциями по сбросу пароля отправлено на указанный email.</p>
          <p className='small_text'>Пожалуйста, проверьте вашу почту и следуйте инструкциям.</p>
          <button className="input-button" type="submit" onClick={() => navigate('/login')}>Вернуться на Вход</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <p className="error">{error}</p>}
          <div className="form-group">
            <input
              type="email"
              id="email"
              value={email}
              placeholder='email'
              className="input-field"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button className="input-button" type="submit">Восстановить пароль</button>
          <button className="input-button" type="submit" onClick={() => navigate('/login')}>Вернуться на Вход</button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
