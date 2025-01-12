import React, { useState, useRef, useEffect } from 'react';
import './Simulation.css';
import '../themes/dark.css';

const Simulation = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const chunksRef = useRef([]);

  const [interviewText, setInterviewText] = useState('');
  const [answerText, setAnswerText] = useState('');
  
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        // Настройка видео
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Настройка аудио записи
        const audioTrack = stream.getAudioTracks()[0];
        const audioStream = new MediaStream([audioTrack]);
        mediaRecorderRef.current = new MediaRecorder(audioStream, {
          mimeType: 'audio/webm' // или другой поддерживаемый формат
        });

        // Обработка записанных чанков
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        // // Когда запись остановлена
        // mediaRecorderRef.current.onstop = () => {
        //   const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        //   sendAudioToServer(audioBlob);
        //   chunksRef.current = [];
        // };

        // // Начинаем запись
        // mediaRecorderRef.current.start(1000); // Записываем чанками по 1 секунде
        // setIsRecording(true);

      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    startMedia();

    // Очистка при размонтировании
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);


  return (
    <div className="body">
      <div className="main-content">
        <div className="left-panel">
          <h2 className="text">Интервьюер</h2>
          <textarea
            className="input-textarea"
            value={interviewText}
            onChange={(e) => setInterviewText(e.target.value)}
            rows={10}
            placeholder="Bla-bla"
          />

          <h2 className="text">Поле для ответа</h2>
          <textarea
            className="input-textarea"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={40}
            placeholder="Bla-bla"
          />
        </div>

        <div className="right-panel">
          {/* <div className="avatar-container">
            <img src="../logo512.png" alt="Profile" className="avatar" />
          </div> */}
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted // важно для избежания фидбэка
              className="video-stream"
            />
          </div>

          
          <div className="time-display">
            15:35
          </div>

          <button className="submit-button">
            Завершить ответ
          </button>
        </div>
      </div>

      <button className="exit-button">
        Выйти
      </button>
    </div>
  );
};

export default Simulation;