from django.urls import include, path  
from .views import ThemesGeneration, AudioGetter

urlpatterns = [  
    path('interview-themes/', ThemesGeneration.as_view() ),
    path('audio-getter/', AudioGetter.as_view() ),
]