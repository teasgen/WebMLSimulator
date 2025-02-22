import React, { useState, useRef, useEffect } from 'react';
import './Simulation.css';
import '../themes/dark.css';

import { useNavigateToMenu } from './common';

const Simulation = () => {
  const navigateToMenu = useNavigateToMenu();

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const timerRef = useRef(null);
  const isTimerRunningRef = useRef(false);
  const [seconds, setSeconds] = useState(0);
  const timerIntervalRef = useRef(null);
  const maxDuration = 5;

  const [interviewText, setInterviewText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const startTimer = () => {
    setSeconds(0);
    isTimerRunningRef.current = true;
    timerIntervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= maxDuration) {
          handleFinish();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };
  
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isTimerRunningRef.current = false;
    setSeconds(0);
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    let stream = null;
    let mediaRecorder = null;

    const startMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        streamRef.current = stream;

        if (videoElement) {
          videoElement.srcObject = stream;
        }

        const audioTrack = stream.getAudioTracks()[0];
        const audioStream = new MediaStream([audioTrack]);
        
        mediaRecorder = new MediaRecorder(audioStream, {
          mimeType: 'audio/webm'
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.start();
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };
    
    startMedia();
    startTimer();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      stopTimer();
    };
  }, []);

  const handleFinish = async () => {
    if (!isTimerRunningRef.current) return;
    isTimerRunningRef.current = false;
    stopTimer();

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      console.warn('MediaRecorder is not active');
      return;
    }

    try {
      const audioData = await new Promise((resolve) => {
        const chunks = [];
        
        const onDataAvailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        const onStop = () => {
          mediaRecorderRef.current.removeEventListener('dataavailable', onDataAvailable);
          mediaRecorderRef.current.removeEventListener('stop', onStop);
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };

        mediaRecorderRef.current.addEventListener('dataavailable', onDataAvailable);
        mediaRecorderRef.current.addEventListener('stop', onStop);
        
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      });

      await sendAudioToServer(audioData);
    } catch (error) {
      console.error('Error in handleFinish:', error);
    }
};

  const startAudioRecording = async () => {
    try {
      if (streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        const audioStream = new MediaStream([audioTrack]);
        
        const newMediaRecorder = new MediaRecorder(audioStream, {
          mimeType: 'audio/webm'
        });
  
        newMediaRecorder.addEventListener('dataavailable', (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        });
  
        mediaRecorderRef.current = newMediaRecorder;
        mediaRecorderRef.current.start();
        startTimer();
      }
    } catch (err) {
      console.error("Error starting audio recording:", err);
    }
  };
  
  const sendAudioToServer = async (audioBlob) => {
      try {
        const formData = new FormData();

        formData.append('audio', audioBlob, 'recording.wav');
        console.log("send to server")
  
        const response = await fetch('http://127.0.0.1:8000/audio-getter/', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
        console.log('Message:', data.message);
  
        setInterviewText(data.message);
  
        setTimeout(async () => {
          await startAudioRecording();
        }, 500);  
  
      } catch (error) {
        console.error('Error sending audio to server:', error);
      }
  };

  useEffect(() => {
    if (timerRef.current) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerRef.current.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
      }
  }, [seconds]);


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
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-stream"
            />
          </div>

          <div ref={timerRef} className="time-display">
            00:00
          </div>

          <div className="time-display">
            15:35
          </div>

          <button className="submit-button" onClick={handleFinish}>
            Завершить ответ
          </button>
        </div>
      </div>

      <button className="exit-button" onClick={navigateToMenu}>
        Выйти
      </button>
    </div>
  );
};

export default Simulation;