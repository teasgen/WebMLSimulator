import os

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from pydub import AudioSegment

from .models import Tasks
from .serialiazers import TasksSerializer


class ThemesGeneration(APIView):
    def post(self, request, *args, **kwargs):
        response = {"themes": ["decision trees"]}
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

            # file_path = default_storage.save(
            #     f'audio_recordings/{audio_file.name}', 
            #     ContentFile(audio_file.read())
            # )
            webm_path = 'temp_audio.webm'
            with open(webm_path, 'wb+') as destination:
                for chunk in audio_file.chunks():
                    destination.write(chunk)

            audio = AudioSegment.from_file(webm_path, format="webm")
            wav_path = 'temp_audio.wav'
            audio.export(wav_path, format="wav")

            os.remove(webm_path)

            return Response({
                'message': 'Audio file received successfully',
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
        
