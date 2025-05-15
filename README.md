# WebMLSimulator

This repository contains a web application for preparing ML engineers for the interviews.

There are 4 services:
- frontend - React JS service which contains all components for communication with user
- main_backend - Django REST with main business logic
- tts_backend - Text to Speech service over GigaAM model
- llm_backend - Validation system, Its Qwen2.5 model trained using LoRA for validating ML tasks

To run the app you must
1. install GigaAM in GigaAM_fork directory via pip and set HF token
2. download LLM as said in llm service readme 
3. install conda environment using requirements.txt
4. run all services according to the corresponding READMEs 