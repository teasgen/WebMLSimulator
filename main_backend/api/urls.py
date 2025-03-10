from django.urls import include, path  
from .views import ThemesGeneration, AudioGetter, TasksGetter, LLMResponseGetter, UpdateLogsDBGetter

urlpatterns = [
    path('interview-themes/', ThemesGeneration.as_view() ),
    path('audio-getter/', AudioGetter.as_view() ),
    path('tasks-getter/', TasksGetter.as_view() ),
    path('generate-question/', LLMResponseGetter.as_view() ),
    path('update-logs-db/', UpdateLogsDBGetter.as_view() ),
]
