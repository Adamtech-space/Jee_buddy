from django.http import JsonResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
# from .agents.math_agent_1 import MathAgent
from .agents.math_agent import MathAgent
import asyncio
import logging
import json
from .models import ChatHistory, UserProfile
import base64
import uuid
from django.db import connections
import os
from django.views.decorators.csrf import csrf_exempt
from django.db.models import F, Q, Count
from django.db.models.expressions import Case, When
from django.db.models.functions import Now, Trunc
from asgiref.sync import sync_to_async, async_to_sync
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from functools import wraps
logger = logging.getLogger(__name__)

def async_view(view_func):
    """Decorator to handle async views properly"""
    @wraps(view_func)
    def wrapped_view(*args, **kwargs):
        return asyncio.run(view_func(*args, **kwargs))
    return wrapped_view

@api_view(['GET'])
def get_current_profile(request):
    """Get user profile from Supabase profiles table"""
    try:
        # Get the user ID from request headers or query params
        user_id = request.GET.get('user_id') or request.headers.get('X-User-Id')
        
        if not user_id:
            return Response({
                'error': 'User ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Query the profiles table
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                SELECT uuid, name, email, current_session_id, created_at, updated_at
                FROM profiles 
                WHERE uuid = %s
            """, [user_id])
            
            row = cursor.fetchone()
            
            if row:
                profile_data = {
                    'uuid': row[0],
                    'name': row[1],
                    'email': row[2],
                    'current_session_id': row[3],
                    'created_at': row[4],
                    'updated_at': row[5]
                }
                
                # If no session ID exists, generate one and update
                if not profile_data['current_session_id']:
                    new_session_id = f"session_{uuid.uuid4().hex[:8]}"
                    cursor.execute("""
                        UPDATE profiles 
                        SET current_session_id = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE uuid = %s
                    """, [new_session_id, user_id])
                    profile_data['current_session_id'] = new_session_id
                
                return Response(profile_data)
            
            return Response({
                'error': 'Profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"Error in get_current_profile: {str(e)}", exc_info=True)
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Create async database operations
@sync_to_async
def get_chat_history(user_id, session_id, limit):
    try:
        return list(ChatHistory.objects.filter(
            user_id=user_id,
            session_id=session_id
        ).order_by('-timestamp')[:limit].values())
    except Exception as e:
        logger.error(f"Error in get_chat_history: {str(e)}")
        return []

@sync_to_async
def save_chat_interaction(user_id, session_id, question, response, context_data):
    try:
        chat = ChatHistory.objects.create(
            user_id=user_id,
            session_id=session_id,
            question=question,
            response=response,
            context=context_data
        )
        return chat.to_dict() if hasattr(chat, 'to_dict') else None
    except Exception as e:
        logger.error(f"Error in save_chat_interaction: {str(e)}")
        return None

async def process_math_problem(request_data):
    try:
        # Extract data from request
        question = request_data.get('question')
        if not question:
            return {
                'error': 'Question is required'
            }, 400
        
        # Handle context data
        context_data = request_data.get('context', {})
        
        # Get user and session info
        user_id = context_data.get('user_id')
        session_id = context_data.get('session_id')
        history_limit = context_data.get('history_limit', 100)

        # Get chat history
        chat_history = []
        if user_id and session_id:
            chat_history = await get_chat_history(user_id, session_id, history_limit)
        
        # Create context
        context = {
            'user_id': user_id,
            'session_id': session_id,
            'chat_history': chat_history,
            'history_limit': history_limit,
            'image': None,
            'interaction_type': context_data.get('interaction_type', 'solve'),
            'pinnedText': context_data.get('pinnedText', ''),
            'selectedText': context_data.get('selectedText', ''),
            'subject': context_data.get('subject', ''),
            'topic': context_data.get('topic', '')
        }

        # Initialize math agent and get solution
        agent = await MathAgent.create()
        solution = await agent.solve(question, context)
        
        if not solution or not solution.get('solution'):
            return {
                'error': 'No solution generated',
                'details': 'The AI agent failed to generate a response.'
            }, 500

        # Save interaction
        if user_id and session_id:
            await save_chat_interaction(
                user_id=user_id,
                session_id=session_id,
                question=question,
                response=solution['solution'],
                context_data={
                    'subject': context.get('subject'),
                    'topic': context.get('topic'),
                    'interaction_type': context.get('interaction_type'),
                    'pinned_text': context.get('pinnedText'),
                }
            )

        # Get updated history
        updated_chat_history = []
        if user_id and session_id:
            updated_chat_history = await get_chat_history(user_id, session_id, history_limit)

        return {
            'solution': solution['solution'],
            'context': {
                'current_question': question,
                'response': solution['solution'],
                'user_id': user_id,
                'session_id': session_id,
                'subject': context.get('subject'),
                'topic': context.get('topic'),
                'chat_history': updated_chat_history
            }
        }, 200
            
    except Exception as e:
        logger.error(f"Error in process_math_problem: {str(e)}", exc_info=True)
        return {
            'error': str(e),
            'details': 'An unexpected error occurred while processing your request.'
        }, 500

@csrf_exempt
@api_view(['POST'])
def solve_math_problem(request):
    try:
        # Debug logging
        logger.info(f"Request Content-Type: {request.content_type}")
        
        # Get the raw request body and clean it
        body = request.body.decode('utf-8').strip()
        logger.info(f"Raw request body: {body}")
        
        # Try to parse JSON directly from request body
        try:
            # Use json.loads with custom parser to handle null values
            data = json.loads(
                body,
                parse_constant=lambda x: None if x.lower() == 'null' else x
            )
            logger.info(f"Parsed data: {data}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error at position {e.pos}: {e.msg}")
            logger.error(f"JSON string: {e.doc}")
            return JsonResponse({
                'error': 'Invalid JSON format',
                'details': f'JSON parse error at position {e.pos}: {e.msg}'
            }, status=400)

        # Validate required fields
        if not isinstance(data, dict):
            return JsonResponse({
                'error': 'Invalid request format',
                'details': 'Request body must be a JSON object'
            }, status=400)

        if 'question' not in data:
            return JsonResponse({
                'error': 'Missing required field',
                'details': 'Question field is required'
            }, status=400)

        if 'context' not in data:
            return JsonResponse({
                'error': 'Missing required field',
                'details': 'Context field is required'
            }, status=400)

        # Clean up the context data
        if 'context' in data and isinstance(data['context'], dict):
            context = data['context']
            if 'image' in context and context['image'] == 'null':
                context['image'] = None

        # Use async_to_sync to properly handle the event loop
        response_data, status_code = async_to_sync(process_math_problem)(data)
        return JsonResponse(response_data, status=status_code)
            
    except Exception as e:
        logger.error(f"Error in solve_math_problem: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e),
            'details': 'An unexpected error occurred while processing your request.'
        }, status=500)