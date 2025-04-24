import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import axios from 'axios';

const EmailVerification = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/users/verify-email/${token}/`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Произошла ошибка при подтверждении email.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="email-verification">
      {status === 'loading' && <p>Проверка email...</p>}
      
      {status === 'success' && (
        <div>
          <h2>Email успешно подтвержден!</h2>
          <p>{message}</p>
          <Link to="/login">Войти в аккаунт</Link>
        </div>
      )}
      
      {status === 'error' && (
        <div>
          <h2>Ошибка подтверждения</h2>
          <p>{message}</p>
          <p>
            <Link to="/resend-verification">Отправить письмо повторно</Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailVerification;
