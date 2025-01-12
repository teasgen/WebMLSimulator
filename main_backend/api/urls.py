from django.urls import include, path  
from .views import ThemesGeneration

urlpatterns = [  
    path('interview-themes/', ThemesGeneration.as_view() ),
]