from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

class ThemesGeneration(APIView):
    # def get(self, request, *args, **kwargs):
    #     response = {"themes": [1, 2, 3]}
    #     return Response(response, status=status.HTTP_201_CREATED)
    
    def post(self, request, *args, **kwargs):
        response = {"themes": ["decision trees"]}
        return Response(response, status=status.HTTP_201_CREATED)