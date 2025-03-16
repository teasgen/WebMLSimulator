import os
import requests
import logging
from collections import defaultdict
from random import shuffle

from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated

from django.http import StreamingHttpResponse
from django.core.files.storage import default_storage
from django.utils.dateparse import parse_datetime
from django.conf import settings

from pydub import AudioSegment
from zoneinfo import ZoneInfo

from .models import Tasks, SimulationInstance
from .serialiazers import TasksSerializer

logger = logging.getLogger(__name__)

class ThemesGeneration(APIView):
    def get(self, request):
        tasks = Tasks.objects.all()
        themes = set()
        for task in tasks:
            themes.add(task.category)
        themes = list(themes)
        shuffle(themes)
        response = {"themes": themes[:5]}
        return Response(response, status=status.HTTP_200_OK)
    

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

            audio_answer_url = getattr(settings, 'AUDIO_ANSWER_URL')

            with open(wav_path, "rb") as audio_file:
                transription = requests.post(
                    url=audio_answer_url,
                    files={"audio": audio_file}
                )
            if transription.status_code != 200:
                raise RuntimeError(transription.reason)

            return Response({
                'message': transription.content.decode("utf-8"),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(e)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LLMResponseGetter(APIView):
    """
    API view that proxies requests to the ValidateAnswer service and streams the response.
    """
    
    def post(self, request, format=None):
        prompt = request.data.get('prompt', '')
        system_prompt_type = request.data.get('system_prompt_type', 0)
        
        if prompt == "":
            return Response({"error": "Prompt is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare the data to send to the ValidateAnswer service
        data = {
            'prompt': prompt,
            'system_prompt_type': system_prompt_type,
        }

        validate_answer_url = getattr(settings, 'VALIDATE_ANSWER_URL')
        
        def stream_response():
            try:
                with requests.post(validate_answer_url, json=data, stream=True, timeout=120) as response:
                    if response.status_code != 200:
                        error_msg = f"Error: Received status code {response.status_code} from ValidateAnswer service"
                        yield error_msg
                        return

                    buffer = b""
                    for chunk in response.iter_content(chunk_size=1):
                        if chunk:
                            if chunk == b'\n':
                                print(f"Sending: {buffer.decode('utf-8', errors='replace')}")
                                yield buffer + b'\n'
                                buffer = b""
                            else:
                                buffer += chunk

                    if buffer:
                        print(f"Sending remaining: {buffer.decode('utf-8', errors='replace')}")
                        yield buffer

            except requests.RequestException as e:
                error_msg = f"Error connecting to ValidateAnswer service: {str(e)}"
                print(error_msg)
                yield error_msg
            except Exception as e:
                error_msg = f"Unexpected error occurred: {str(e)}"
                print(error_msg)
                yield error_msg
        
        return StreamingHttpResponse(
            streaming_content=stream_response(),
            content_type='text/event-stream'
        )
        
class LogsDB(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        try:
            data = request.data
            print(data)
            if data.get("is_ended") is None:
                current_qa_block = {
                    "theme": data.get("theme"),
                    "question": data.get("question"),
                    "answer": data.get("answer"),
                    "comment": data.get("comment"),
                    "mark": data.get("mark"),
                }

                naive_datetime = parse_datetime(data.get("start_time"))
                datetime = naive_datetime.replace(tzinfo=ZoneInfo("Etc/GMT+3"))

                instance, _ = SimulationInstance.objects.get_or_create(
                    userID=data.get("userID"),
                    datetime=datetime,
                    defaults={'qa_blocks': []}
                )

                instance.qa_blocks.append(current_qa_block)
                instance.save()

                return Response(
                    {'response': f"QA block {current_qa_block} was successfully added"}, 
                    status=status.HTTP_201_CREATED
                )
            else:
                naive_datetime = parse_datetime(data.get("start_time"))
                datetime = naive_datetime.replace(tzinfo=ZoneInfo("Etc/GMT+3"))

                instance = SimulationInstance.objects.get(
                    userID=data.get("userID"),
                    datetime=datetime,
                )

                instance.is_ended = data.get("is_ended")
                instance.save()
                return Response(
                    {'response': f"Simulation instance is_ended set"}, 
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            print(e)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        user_id = request.data.get("userID")
        datetime = request.data.get("start_time", None)
        if datetime:
            naive_datetime = parse_datetime(datetime)
            datetime = naive_datetime.replace(tzinfo=ZoneInfo("Etc/GMT+3"))
            tasks = SimulationInstance.objects.get(
                userID=user_id,
                datetime=datetime,
            )
            return Response(
                tasks.qa_blocks, 
                status=status.HTTP_200_OK,
            )
        else:
            tasks = SimulationInstance.objects.filter(userID=user_id)
            return Response([{
                    "datetime": t.datetime.astimezone(ZoneInfo("Etc/GMT+3")),
                    "mark": sum(sample["mark"] for sample in t.qa_blocks) / len(t.qa_blocks),
                } for t in tasks if len(t.qa_blocks) > 0],
                status=status.HTTP_200_OK,
            )

class StaticticsLogsDB(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get("userID")
        task_name = request.data.get("task_name")
        simulations = SimulationInstance.objects.filter(userID=user_id)
        if task_name == "recommendations":
            themes = defaultdict(list)
            for simulation in simulations:
                for block in simulation.qa_blocks:
                    themes[block["theme"]].append(block["mark"])
            marks = [(sum(mark) / len(mark), theme) for theme, mark in themes.items()]
            marks.sort(key=lambda tup: tup[0])
            print(marks)
            return Response(marks[:5], status=status.HTTP_200_OK)
        elif task_name == "graphic":
            datetimes = defaultdict(list)
            for simulation in simulations:
                for block in simulation.qa_blocks:
                    datetimes[simulation.datetime.strftime("%Y-%m-%d")].append(block["mark"])
            marks = [(sum(mark) / len(mark), day) for day, mark in datetimes.items()]
            marks.sort(key=lambda tup: tup[1]) # sort by day
            print(marks)
            return Response(marks[:5], status=status.HTTP_200_OK)
        else:
            return Response({"error:", "Unsupported task name"}, status=status.HTTP_400_BAD_REQUEST)