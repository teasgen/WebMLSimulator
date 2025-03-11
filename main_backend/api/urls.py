from django.urls import include, path  
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import ThemesGeneration, AudioGetter, TasksGetter, LLMResponseGetter, UpdateLogsDBGetter, UserDataView

urlpatterns = [
    path('interview-themes/', ThemesGeneration.as_view() ),
    path('audio-getter/', AudioGetter.as_view() ),
    path('tasks-getter/', TasksGetter.as_view() ),
    path('generate-question/', LLMResponseGetter.as_view() ),
    path('update-logs-db/', UpdateLogsDBGetter.as_view() ),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserDataView.as_view(), name='user-data'),
]
