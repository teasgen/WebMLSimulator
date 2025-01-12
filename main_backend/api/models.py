from django.db import models
from django.utils import timezone

class QABlock(models.Model):
  question = models.CharField(max_length=65535)
  reply = models.CharField(max_length=65535)
  comment = models.CharField(max_length=65535)
  question_type = models.CharField(max_length=65535)
  userID = models.IntegerField(default=0)
  datetime = models.DateTimeField("date published", auto_now_add=True)

  def __str__(self) -> str:
    return self.firstname
