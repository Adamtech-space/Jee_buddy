from django.db import models
from django.db import transaction
import uuid
import json
import logging

logger = logging.getLogger(__name__)

MAX_HISTORY_LENGTH = 20  # Set to 20 as per your requirement

class ChatHistory(models.Model):
    user_id = models.CharField(max_length=255)  # Supabase user ID
    session_id = models.CharField(max_length=100)
    question = models.TextField()
    response = models.TextField()
    context = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    def to_dict(self):
        """Convert the model instance to a dictionary"""
        data = {
            'user_id': self.user_id,
            'session_id': self.session_id,
            'question': self.question,
            'response': self.response,
            'context': self.context,
            'timestamp': self.timestamp.isoformat()
        }
        
        # Add visualization if available
        if self.context.get('visualization'):
            data['visualization'] = self.context['visualization']
            
        return data

    @classmethod
    def add_interaction(cls, user_id, session_id, question, response, context):
        """
        Adds a new interaction and ensures the chat history does not exceed MAX_HISTORY_LENGTH.
        """
        logger.info(f"Adding interaction for user_id: {user_id}, session_id: {session_id}")
        
        with transaction.atomic():
            # Check the current count of chats for the user
            current_count = cls.objects.filter(user_id=user_id).count()

            # If the count exceeds the limit, delete the oldest entries
            if current_count >= MAX_HISTORY_LENGTH:
                entries_to_remove = current_count - (MAX_HISTORY_LENGTH - 1)
                oldest_entries = cls.objects.filter(user_id=user_id) \
                                  .order_by('timestamp')[:entries_to_remove]
                oldest_entries.delete()

            # Create the new interaction
            return cls.objects.create(
                user_id=user_id,
                session_id=session_id,
                question=question,
                response=response,
                context=context
            )

    @classmethod
    def get_recent_history(cls, user_id, session_id, limit=MAX_HISTORY_LENGTH):
        """
        Retrieves the most recent chat history for a user and session.
        """
        history = cls.objects.filter(
            user_id=user_id,
            session_id=session_id
        ).order_by('-timestamp')[:limit]

        return [chat.to_dict() for chat in history]

    class Meta:
        db_table = 'main_chathistory'  # Explicitly set the table name
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user_id', 'timestamp']),  # Optimized for filtering by user_id and timestamp
            models.Index(fields=['session_id'])  # Optimized for filtering by session_id
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user_id', 'session_id', 'question', 'timestamp'],
                name='unique_chat_interaction'
            )
        ]


class MathProblem(models.Model):
    question = models.TextField()
    category = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['question']),  # Optimized for searching by question
            models.Index(fields=['last_accessed'])  # Optimized for sorting by last_accessed
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

    class Meta:
        indexes = [
            models.Index(fields=['problem', 'created_at']),  # Optimized for filtering by problem and creation time
        ]