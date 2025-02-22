from django.db import models
from django.utils import timezone

MAX_STR_LENGTH = 2 ** 16 - 1

class QABlock(models.Model):
  question = models.CharField(max_length=MAX_STR_LENGTH)
  reply = models.CharField(max_length=MAX_STR_LENGTH)
  comment = models.CharField(max_length=MAX_STR_LENGTH)
  question_type = models.CharField(max_length=MAX_STR_LENGTH)
  userID = models.IntegerField(default=0)
  datetime = models.DateTimeField("date published", auto_now_add=True)

  def __str__(self) -> str:
    return self.firstname

class Tasks(models.Model):
  category = models.CharField(max_length=MAX_STR_LENGTH)
  task = models.CharField(max_length=MAX_STR_LENGTH)
  answer = models.CharField(max_length=MAX_STR_LENGTH, default=None, null=True)
