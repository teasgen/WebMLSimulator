import React, { useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import AuthContext from '../../context/AuthContext';
import '../Login.css';

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { confirmPasswordReset } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('Пароль обязателен');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    const result = await confirmPasswordReset(token, newPassword);
    if (result.success) {
      setSubmitted(true);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(result.error);
    }
  };

  return (
    <div  id="login">
      {submitted ? (
        <div>
          <p className='small_text'>Ваш пароль успешно изменен!</p>
          <p className='small_text'>Вы будете перенаправлены на страницу входа через несколько секунд...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <p className="error">{error}</p>}
          <div>
            <input
              type="password"
              value={newPassword}
              placeholder='Новый пароль'
              className="input-field"
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              id="confirm-password"
              placeholder='Подтвердите пароль'
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button className="input-button" type="submit">Установить новый пароль</button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
