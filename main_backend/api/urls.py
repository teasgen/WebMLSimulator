from django.urls import include, path  
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import ThemesGeneration, AudioGetter, TasksGetter, LLMResponseGetter, LogsDB

urlpatterns = [
    path('interview-themes/', ThemesGeneration.as_view() ),
    path('audio-getter/', AudioGetter.as_view() ),
    path('tasks-getter/', TasksGetter.as_view() ),
    path('generate-question/', LLMResponseGetter.as_view() ),
    path('logs-db/', LogsDB.as_view() ),
]
