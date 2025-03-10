from rest_framework import serializers  
from .models import Tasks, SimulationInstance
  
class TasksSerializer(serializers.ModelSerializer):  
    class Meta:  
        model = Tasks
        fields = ('category', 'task', 'answer')

class SimulationInstanceSerializer(serializers.ModelSerializer):  
    class Meta:  
        model = SimulationInstance
        fields = ('qa_blocks', 'userID', 'datetime')
