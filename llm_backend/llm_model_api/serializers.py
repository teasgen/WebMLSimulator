from rest_framework import serializers

MAX_STR_LENGTH = 2 ** 16 - 1

class LLMSerializer(serializers.Serializer):
    prompt = serializers.CharField(max_length=MAX_STR_LENGTH)
    system_prompt_type = serializers.IntegerField(default=0)
