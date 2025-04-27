import queue

from django.apps import apps 
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.response import Response
from rest_framework import status

from .serializers import LLMSerializer


from .apps import model_path, engine_pool

class ValidateAnswer(APIView):
    system_prompt = """Ты проводишь онлайн собеседование. Прокомментируй ответ пользователя. Дай ему оценку от 1 до 10:
1 - пользователь ответил абсолютно нерелевантную информацию
2 - пользователь ответил нерелевантную информацию, однако упомянул верный факт про машинное обучение
3 - пользователь ответил нерелевантную информацию, однако упомянул верный факт, затрагивающий тему
4 - пользователь ответил на вопрос очень кратко, объяснил поверхностно
5 - пользователь ответил на вопрос кратко, однако указал верные факты, допускаются неточности
6 - пользователь ответил на вопрос, указал верные факты, допускаются неточности. Однако ответ требует дополнений, могут быть упущены какие-то важные аспекты
7 - пользователь ответил на вопрос, указал верные факты, допускаются неточности. Однако ответ требует дополнений, все важные аспекты должны быть упомянуты
8 - пользователь ответил на вопрос, указал верные факты, неточностей быть не должно. Однако ответ требует дополнений - примеров, все важные аспекты должны быть упомянуты
9 - пользователь ответил на вопрос, указал верные факты, неточностей быть не должно. Ответ точен и полон, все важные аспекты должны быть упомянуты, ответ расширяет вопрос, а не отвечает напрямую
10 - пользователь ответил на вопрос полностью корректно, дополнений быть не может. Идеальный ответ.
При неполном ответе придумай вопрос с уточнением и напиши его. Если ответ на 10, то можешь придумать дополнительный вопрос. Ответ должен быть в json формате с полями {} в строго указанном порядке\n"""

    def post(self, request, format=None):
        serializer = LLMSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        prompt = serializer.validated_data['prompt']
        system_prompt_type = serializer.validated_data.get('system_prompt_type', 0)
        if system_prompt_type == -1:
            formatted_system_prompt = ""
        elif system_prompt_type == 0:
            formatted_system_prompt = self.system_prompt.format("'Оценка', 'Новый вопрос', 'Комментарий проверяющей системы'")
        elif system_prompt_type == 1:
            formatted_system_prompt = self.system_prompt.format("'Оценка', 'Комментарий проверяющей системы'")

        messages = [
            {"role": "system", "content": formatted_system_prompt},
            {"role": "user", "content": prompt}
        ]
        try:
            engine = engine_pool.get(timeout=120)
        except queue.Empty:
            return Response({'error': 'Сервера перегружены, попробуйте позже.'}, status=503)

        try:
            def token_generator():
                for response in engine.chat.completions.create(
                    messages=messages,
                    model=model_path,
                    stream=True,
                ):
                    for choice in response.choices:
                        delta = getattr(choice.delta, "content", None)
                        if delta:
                            yield delta

            response = StreamingHttpResponse(token_generator(), content_type='text/event-stream')
            response['Cache-Control'] = 'no-cache'
            response['X-Accel-Buffering'] = 'no'
            return response
        finally:
            engine_pool.put(engine)
