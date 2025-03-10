from rest_framework import serializers

MAX_STR_LENGTH = 2 ** 16 - 1

class LLMSerializer(serializers.Serializer):
    prompt = serializers.CharField(max_length=MAX_STR_LENGTH)
    use_validation_system_prompt = serializers.BooleanField(default=True)
