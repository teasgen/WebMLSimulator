import gigaam
from django.apps import AppConfig


class TtsModelApiConfig(AppConfig):
    name = 'tts_model_api'

    def ready(self):
        self.model = gigaam.load_model("ctc")