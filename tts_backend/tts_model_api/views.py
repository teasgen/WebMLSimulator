from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import AudioSerializer
from django.apps import apps 
import os
from django.core.files.storage import default_storage

class TranscribeAudio(APIView):
    def post(self, request, format=None):
        serializer = AudioSerializer(data=request.data)
        if serializer.is_valid():
            audio_file = serializer.validated_data['audio']
            
            path = default_storage.save('tmp/audio.wav', content=audio_file)
            audio_path = os.path.join(default_storage.location, path)
            
            app_config = apps.get_app_config('tts_model_api')
            model = app_config.model
            recognition_result = model.transcribe_longform(audio_path)

            transcriptions = []
            for utterance in recognition_result:
                transcription = utterance["transcription"]
                transcriptions.append(transcription)

            os.remove(audio_path)

            return Response({"transcriptions": ". ".join(transcriptions)}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)