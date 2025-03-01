import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router";
import './Simulation.css';
import '../themes/dark.css';

import { getLLMResponse } from "../services/ApiService";
import { useNavigateToMenu } from './common';

const Simulation = () => {
  const navigateToMenu = useNavigateToMenu();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const [intervalSeconds, setIntervalSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // interval timer
  const timerRef = useRef(null);
  const isTimerRunningRef = useRef(false);
  const timerIntervalRef = useRef(null);
  const maxDuration = 50;

  // session timer
  const sessionTimerRef = useRef(null);
  const isSessionTimerRunningRef = useRef(false);
  const maxSessionDuration = 500;

  const [interviewText, setInterviewText] = useState('');
  const [answerText, setAnswerText] = useState('');

  const startTimer = () => {
    setIntervalSeconds(0);
    isTimerRunningRef.current = true;
    timerIntervalRef.current = setInterval(() => {
      setIntervalSeconds((prev) => {
        if (prev >= maxDuration) {
          handleFinishQABlock();
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
    setIntervalSeconds(0);
  };

  const startSessionTimer = () => {
    setSessionSeconds(0);
    isSessionTimerRunningRef.current = true;
    sessionTimerRef.current = setInterval(() => {
      setSessionSeconds(prev => {
        if (prev >= maxSessionDuration) {
          endSession();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopSessionTimer = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    setSessionSeconds(0);
  };

  useEffect(() => {
    if (timerRef.current) {
        // const minutes = Math.floor(seconds / 60);
        // const remainingSeconds = seconds % 60;
        const remainingSeconds = maxDuration - intervalSeconds
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        timerRef.current.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
  }, [intervalSeconds]);

  useEffect(() => {
    if (sessionTimerRef.current) {
        const minutes = Math.floor(sessionSeconds / 60);
        const seconds = sessionSeconds % 60;
        sessionTimerRef.current.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
  }, [sessionSeconds]);

  const endSession = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopSessionTimer();
    stopTimer();
    setTimeout(() => {
      navigate("/menu"); // Move to the intended page after stopping everything
    }, 0);
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
    if (!isSessionTimerRunningRef.current) {
      startSessionTimer();
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
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

  const handleFinishQABlock = async () => {
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

      const audio_transcription = await sendAudioToServer(audioData);
      console.log("audio_transcription: ", audio_transcription)
      const llm_answer = await sendQuestionToServer(interviewText, answerText, audio_transcription);
      console.log("llm_answer: ", llm_answer)
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
        console.log("send audio to server")
  
        const response = await fetch('http://127.0.0.1:8000/audio-getter/', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
        console.log('Message:', data.message);
  
        setTimeout(async () => {
          await startAudioRecording();
        }, 500);  

        return data.message
  
      } catch (error) {
        console.error('Error sending audio to server:', error);
      }
  };
  
  const sendQuestionToServer = async (question, answer_text, answer_audio) => {
    const prompt = {
      "prompt": "Вопрос: " + question + "\nОтвет текстом: " + answer_text + "\nОтвет аудио: " + answer_audio
    };

    console.log("send answer to server")
    const answer = await getLLMResponse(prompt);

    return answer.message;
  };

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

          <div ref={sessionTimerRef} className="time-display">
            00:00
          </div>

          <button className="submit-button" onClick={handleFinishQABlock}>
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