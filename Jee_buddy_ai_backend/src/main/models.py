from django.db import models
from django.utils import timezone
import json
from django.db import models
import json
MAX_HISTORY_LENGTH = 10


class MathProblem(models.Model):
    question = models.TextField()
    category = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['question']),
            models.Index(fields=['last_accessed'])
        ]



class Solution(models.Model):
    problem = models.ForeignKey(MathProblem, on_delete=models.CASCADE, related_name='solutions')
    approach_type = models.CharField(max_length=50)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    context_data = models.JSONField(default=dict)  # Stores topics and related approaches
    
    def get_context_data(self):
        """Get parsed context data."""
        try:
            return json.loads(self.context_data)
        except json.JSONDecodeError:
            return {}