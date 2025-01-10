from django.db import models
from django.utils import timezone
import json
from django.db import models
import json
MAX_HISTORY_LENGTH = 10

# models.py
from django.db import models
import uuid

class UserProfile(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, null=True)
    email = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    current_session_id = models.CharField(max_length=255, null=True)

    class Meta:
        db_table = 'chat_profiles'
        

class ChatHistory(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, to_field='uuid')
    session_id = models.CharField(max_length=255)
    question = models.TextField()
    response = models.TextField()
    context = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    @classmethod
    def get_user_history(cls, user_id, session_id=None, limit=100):
        query = cls.objects.filter(user_id=user_id)
        if session_id:
            query = query.filter(session_id=session_id)
        return query.order_by('-timestamp')[:limit]

    @classmethod
    def add_interaction(cls, user_id, session_id, question, response, context):
        return cls.objects.create(
            user_id=user_id,
            session_id=session_id,
            question=question,
            response=response,
            context=context
        )
    

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

    @classmethod
    def get_user_history(cls, user_id, limit=5):
        """Get user's recent history across all sessions"""
        return cls.objects.filter(
            user_id=user_id
        ).order_by('-timestamp')[:limit]
    
    class Meta:
        ordering = ['-timestamp']