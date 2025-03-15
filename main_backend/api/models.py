from django.db import models
from django.utils import timezone

MAX_STR_LENGTH = 2 ** 16 - 1

class SimulationInstance(models.Model):
  qa_blocks = models.JSONField()
  userID = models.IntegerField(default=0)
  datetime = models.DateTimeField()
  is_ended = models.BooleanField(default=False)


class Tasks(models.Model):
  category = models.CharField(max_length=MAX_STR_LENGTH)
  task = models.CharField(max_length=MAX_STR_LENGTH)
  answer = models.CharField(max_length=MAX_STR_LENGTH, default=None, null=True)
