import os
from threading import Thread

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.apps import apps 
from django.http import StreamingHttpResponse
from transformers import TextIteratorStreamer

from .serializers import LLMSerializer


class ValidateAnswer(APIView):
    system_prompt = """Ты проводишь онлайн собеседование. Прокомментируй ответ пользователя. Дай ему оценку от 1 до 10:
1 - пользователь ответил абсолютно нерелевантную информацию
2 - пользователь ответил нерелевантную информацию, однако упомянул верный факт про машинное обучение
3 - пользователь ответил нерелевантную информацию, однако упомянул верный факт, затрагивающий тему
4 - пользователь ответил на вопрос очень кратно, объяснил поверхностно
5 - пользователь ответил на вопрос кратко, однако указал верные факты, допускаются неточности
6 - пользователь ответил на вопрос, указал верные факты, допускаются неточности. Однако ответ требует дополнений, могут быть упущены какие-то важные аспекты
7 - пользователь ответил на вопрос, указал верные факты, допускаются неточности. Однако ответ требует дополнений, все важные аспекты должны быть упомянуты
8 - пользователь ответил на вопрос, указал верные факты, неточностей быть не должно. Однако ответ требует дополнений - примеров, все важные аспекты должны быть упомянуты
9 - пользователь ответил на вопрос, указал верные факты, неточностей быть не должно. Ответ точен и полон, все важные аспекты должны быть упомянуты, ответ расширает вопрос, а не отвечает напрямую
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

        app_config = apps.get_app_config('llm_model_api')
        model = app_config.model
        tokenizer = app_config.tokenizer

        messages = [
            {"role": "system", "content": formatted_system_prompt},
            {"role": "user", "content": prompt}
        ]
        print(f"get: {prompt, formatted_system_prompt}")
        inputs = tokenizer.apply_chat_template(
            messages,
            tokenize = True,
            add_generation_prompt = True,
            return_tensors = "pt",
        ).to("mps")

        text_streamer = TextIteratorStreamer(tokenizer, skip_prompt = True)
        generation_kwargs = dict(input_ids=inputs, streamer=text_streamer, max_new_tokens=512, temperature = 1.5, min_p = 0.1)
        thread = Thread(target=model.generate, kwargs=generation_kwargs)
        thread.start()

        def token_generator():
            for new_text in text_streamer:
                if new_text == "":
                    continue
                print(new_text)
                yield f"{new_text}\n"

        response = StreamingHttpResponse(token_generator(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'

        return response
