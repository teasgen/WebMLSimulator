import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from "react-router";
import AuthContext from '../context/AuthContext';
import './Simulation.css';
import '../themes/dark.css';

import { getLLMResponse, updateLogsDB, getThemes } from "../services/ApiService";
import { useNavigateToMenu } from './common';

const Simulation = () => {
  const [startTime, setStartTime] = useState(new Date().toISOString());
  const [statusText, setStatusText] = useState("Starting");
  const { user } = useContext(AuthContext);

  const navigateToMenu = useNavigateToMenu();
  const navigate = useNavigate();
  const themesRef = useRef(null);

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
  const maxDuration = 30;

  // session timer
  const sessionTimerIntervalRef = useRef(null);
  const sessionTimerDisplayRef = useRef(null);
  const isSessionTimerRunningRef = useRef(false);
  const maxSessionDuration = 100;

  const [interviewText, setInterviewText] = useState('');
  const themeSessionDuration = useRef(0);
  const [answerText, setAnswerText] = useState('');
  const interviewTextRef = useRef(interviewText);
  const answerTextRef = useRef(answerText);

  const currentTheme = useRef(null);

  useEffect(() => {
    interviewTextRef.current = interviewText;
  }, [interviewText]);
  
  useEffect(() => {
    answerTextRef.current = answerText;
  }, [answerText]);  

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
    sessionTimerIntervalRef.current = setInterval(() => {
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
    if (sessionTimerIntervalRef.current) {
      clearInterval(sessionTimerIntervalRef.current);
      sessionTimerIntervalRef.current = null;
    }
    isSessionTimerRunningRef.current = false;
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
    if (sessionTimerDisplayRef.current) {
        const minutes = Math.floor(sessionSeconds / 60);
        const seconds = sessionSeconds % 60;
        sessionTimerDisplayRef.current.textContent = 
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
      navigateToHistory();
    }, 0);
  };

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const themesData = await getThemes();
        themesRef.current = themesData;
        console.log(themesRef.current.themes[0])
        setStatusText('Generating first question...');
        await sendQuestionGenerationToServer(themesRef.current.themes[0]);
        currentTheme.current = themesRef.current.themes[0];
        themesRef.current.themes = themesRef.current.themes.slice(1);
      } catch (error) {
        console.error("Error during themes getting process:", error);
      }
    };
    const videoElement = videoRef.current;
    let stream = null;
    let mediaRecorder = null;
    fetchThemes().then(() => {
      setStatusText('Answer!');
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
    });

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
      stopSessionTimer();
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

      console.log(startTime);
      const audio_transcription = await sendAudioToServer(audioData);
      const old_question = interviewTextRef.current;
      const text_answer = answerTextRef.current;   
      console.log("old_question: ", old_question)
      console.log("text_answer: ", text_answer)
      console.log("audio_transcription: ", audio_transcription)
      const llm_answer = await sendQuestionToServer(old_question, text_answer, audio_transcription);
      console.log("llm_answer: ", llm_answer)
      let mark = llm_answer["mark"]
      const validation_system_comment = llm_answer["comment"]
      await sendUpdateLogsDBToServer(old_question, text_answer, audio_transcription, validation_system_comment, mark)
      setStatusText('Answer!');
      await startAudioRecording();
    } catch (error) {
      console.error('Error in handleFinishQABlock:', error);
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
  
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch('http://127.0.0.1:8000/audio-getter/', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
  
        if (!response.ok) {
          console.log(response)
          throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
        console.log('Message:', data.message);

        return data.message
  
      } catch (error) {
        console.error('Error sending audio to server:', error);
      }
  };

  const handleValidationLLMStreamingResponse = async (prompt) => {
    setStatusText('Validating answer...');
    themeSessionDuration.current += 1;

    let localInterviewText = '';
    let localRating = '';
    let localSystemComment = '';
    try {
      const reader = await getLLMResponse(prompt);
      const decoder = new TextDecoder('utf-8');
      let current_key = "";
      let is_key = true;
      let current_str = "";
      let new_question_doesnt_required = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        current_str = decoder.decode(value, { stream: true });
        if (current_str[0] === "{")
            current_str = current_str.slice(1);
        if (current_str.includes("<|im_end|>"))
            current_str = current_str.slice(0, current_str.indexOf("<|im_end|>"))
        if (current_str[current_str.length - 1] === "}")
            current_str = current_str.slice(0, current_str.length - 1);

        const parts = current_str.split(/\s+/);
        for (let i = 0; i < parts.length; i++) {
            let cur = parts[i].trim();
            if (cur === "" || cur === "\n")
                continue
            if (cur.includes("\"Новый") || cur.includes("\"Комментарий") || cur.includes("\"Оценка")) {
                is_key = true;
                cur = cur.slice(1); // remove " at the beginning, check whether key is a single word
                const index = cur.indexOf("\":");
                if (index !== -1) {
                    current_key = cur.slice(0, index);
                    is_key = false;
                }
                else
                    current_key = cur + " ";
            }
            else if (cur.includes("\":")) {
                let idx = cur.indexOf("\":");
                let remain_key = cur.slice(0, idx);
                current_key += remain_key; // remove ": at the end of key
                is_key = false;
            }
            else {
                cur = cur.replace(/"/g, "");
                if (is_key)
                    current_key += cur + " ";
                else {
                    current_key = current_key.trim();
                    if (cur[cur.length - 1] === ",")
                    cur = cur.slice(0, cur.length - 1);
                    if (current_key === "Новый вопрос" && !new_question_doesnt_required) {
                      localInterviewText += cur + " ";
                      setInterviewText(localInterviewText);
                    }
                    else if (current_key === "Комментарий проверяющей системы") {
                      localSystemComment += cur + " ";
                      setStatusText('Time to think...');
                    }
                    else if (current_key === "Оценка") {
                      localRating = parseFloat(cur);
                      if (localRating > 8 || themeSessionDuration.current >= 5) {
                        sendQuestionGenerationToServer(themesRef.current.themes[0]);
                        currentTheme.current = themesRef.current.themes[0];
                        themesRef.current.themes = themesRef.current.themes.slice(1);
                        new_question_doesnt_required = true;
                        themeSessionDuration.current = 0;
                        setStatusText('Time to think...');
                      }
                    }            
                }
            }
        }
      }
      return { "interviewText": localInterviewText, "systemComment": localSystemComment, "rating": localRating };
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleQuestionGenerationLLMStreamingResponse = async (prompt) => {
    setInterviewText('');

    let localInterviewText = '';
    try {
      const reader = await getLLMResponse(prompt);
      const decoder = new TextDecoder('utf-8');
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let current_str = decoder.decode(value, { stream: true });
        if (current_str.includes("<|im_end|>"))
            current_str = current_str.slice(0, current_str.indexOf("<|im_end|>"))

        localInterviewText += current_str.trim() + " ";
        setInterviewText(localInterviewText);
      }
      return { "interviewText": localInterviewText};
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const sendQuestionToServer = async (question, answer_text, answer_audio) => {
    const prompt = {
      "prompt": "{" + "\"Вопрос\": " + question + ", \"Ответ пользователя\": " + answer_audio + ". " + answer_text + "}",
      "system_prompt_type": 0,
    };

    console.log("send answer to server")
    const result = await handleValidationLLMStreamingResponse(prompt);
    return { "new_quesiton": result.interviewText, "comment": result.systemComment, "mark": result.rating };
  };

  const sendQuestionGenerationToServer = async (theme) => {
    setInterviewText('Generating new question...');
    const prompt = {
      "prompt": "Придумай строго один теоретический вопрос по машинному обучению по теме " + theme,
      "system_prompt_type": -1,
    };

    console.log("send answer to server")
    const result = await handleQuestionGenerationLLMStreamingResponse(prompt);
    return { "new_quesiton": result.interviewText};
  };

  const sendUpdateLogsDBToServer = async (question, answer_text, answer_audio, validation_system_comment, mark) => {
    console.log(user, user.id)
    const QABlock = {
      "userID": user ? user.id : 0,
      "start_time": startTime,
      "question": question,
      "answer": answer_audio + "\n" + answer_text,
      "comment": validation_system_comment,
      "mark": mark,
      "theme": currentTheme.current,
    };
    console.log(QABlock);

    console.log("send new QA block to server")
    await updateLogsDB(QABlock);
  };

  const sendEndedSessionToServer = async () => {
    const body = {
      "userID": user ? user.id : 0,
      "start_time": startTime,
      "is_ended": true,
    };
    console.log("is_ended");
    await updateLogsDB(body);
  };

  const navigateToHistory = () => {
    sendEndedSessionToServer().then(
      navigate("/single-history", {
        state: {
          startTime: startTime, 
        }
      })
    );
  };

  return (
    <div className="body">
      <div className="main-content">
        <div className="left-panel">
          <h2 className="text">{statusText}</h2>
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

          <div ref={sessionTimerDisplayRef} className="time-display">
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