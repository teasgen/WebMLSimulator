import os
import requests
from random import shuffle

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from pydub import AudioSegment

from .models import Tasks
from .serialiazers import TasksSerializer


class ThemesGeneration(APIView):
    def get(self, request):
        tasks = Tasks.objects.all()
        themes = set()
        for task in tasks:
            themes.add(task.category)
        themes = list(themes)
        shuffle(themes)
        response = {"themes": themes[:5]}
        return Response(response, status=status.HTTP_201_CREATED)
    

class TasksGetter(generics.ListCreateAPIView):
    queryset = Tasks.objects.all()
    serializer_class = TasksSerializer


class AudioGetter(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        try:
            audio_file = request.FILES.get('audio')
            if not audio_file:
                return Response({'error': 'No audio file provided'}, 
                              status=status.HTTP_400_BAD_REQUEST)

            webm_path = 'temp_audio.webm'
            with open(webm_path, 'wb+') as destination:
                for chunk in audio_file.chunks():
                    destination.write(chunk)

            audio = AudioSegment.from_file(webm_path, format="webm")
            wav_path = 'temp_audio.wav'
            audio.export(wav_path, format="wav")

            os.remove(webm_path)

            with open(wav_path, "rb") as audio_file:
                transription = requests.post(
                    url="http://localhost:3001/transcribe/",
                    files={"audio": audio_file}
                )
            if transription.status_code != 200:
                raise RuntimeError(transription.reason)

            return Response({
                'message': transription,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(e)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LLMResponseGetter(APIView):
    def post(self, request):
        try:
            prompt = request.data.get('prompt')
            return Response({
                'message': f'Prompt: {prompt}, successfully',
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(e)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
