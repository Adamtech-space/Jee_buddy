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


class ChatHistory(models.Model):
    session_id = models.CharField(max_length=100)
    question = models.TextField()
    response = models.TextField()
    context = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    def to_dict(self):
        """Convert the model instance to a dictionary"""
        return {
            'session_id': self.session_id,
            'question': self.question,
            'response': self.response,
            'context': self.context,
            'timestamp': self.timestamp.isoformat()
        }

    @classmethod
    def add_interaction(cls, session_id, question, response, context):
        # First, check if we need to cleanup old interactions
        old_interactions = cls.objects.filter(session_id=session_id).order_by('-timestamp')[100:]
        if old_interactions.exists():
            old_interactions.delete()
            
        return cls.objects.create(
            session_id=session_id,
            question=question,
            response=response,
            context=context
        )

    @classmethod
    def get_recent_history(cls, session_id, limit=100):
        history = list(cls.objects.filter(
            session_id=session_id
        ).order_by('-timestamp')[:limit])
        return [item.to_dict() for item in history]  # Convert to dictionary

    class Meta:
        ordering = ['-timestamp']