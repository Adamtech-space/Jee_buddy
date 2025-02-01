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
from .models import ChatHistory
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
from django.utils import timezone
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
        question = request_data.get('question', '')
        if not question:
            return {
                'error': 'Question is required'
            }, 400

        # Create context dictionary from form data
        context = {
            'user_id': request_data.get('user_id'),
            'session_id': request_data.get('session_id'),
            'subject': request_data.get('subject', ''),
            'topic': request_data.get('topic', ''),
            'interaction_type': request_data.get('type', ''),
            'pinnedText': request_data.get('pinnedText', ''),
            'selectedText': request_data.get('selectedText', ''),
            'Deep_think': request_data.get('Deep_think', False),
            'image': request_data.get('image'),  # This will contain the base64 image
            'source': request_data.get('source', 'Chat')
        }
        
        # Get chat history
        chat_history = []
        if context['user_id'] and context['session_id']:
            chat_history = await get_chat_history(
                context['user_id'], 
                context['session_id'], 
                request_data.get('history_limit', 100)
            )
        context['chat_history'] = chat_history

        # Initialize math agent and get solution
        agent = await MathAgent.create()
        solution = await agent.solve(question, context)
        
        if not solution or not solution.get('solution'):
            return {
                'error': 'No solution generated',
                'details': 'The AI agent failed to generate a response.'
            }, 500

        # Save interaction
        if context['user_id'] and context['session_id']:
            await save_chat_interaction(
                user_id=context['user_id'],
                session_id=context['session_id'],
                question=question,
                response=solution['solution'],
                context_data={
                    'subject': context['subject'],
                    'topic': context['topic'],
                    'interaction_type': context['interaction_type'],
                    'pinned_text': context['pinnedText'],
                }
            )

        # Get updated history
        updated_chat_history = []
        if context['user_id'] and context['session_id']:
            updated_chat_history = await get_chat_history(
                context['user_id'], 
                context['session_id'], 
                request_data.get('history_limit', 100)
            )

        return {
            'solution': solution['solution'],
            'context': {
                'current_question': question,
                'response': solution['solution'],
                'user_id': context['user_id'],
                'session_id': context['session_id'],
                'subject': context['subject'],
                'topic': context['topic'],
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
@parser_classes([MultiPartParser, FormParser, JSONParser])
def solve_math_problem(request):
    try:
        logger.info(f"Request Content-Type: {request.content_type}")
        
        # Handle form data
        if request.content_type.startswith('multipart/form-data'):
            data = request.data.copy()  # Get mutable copy of request data
            
            # Handle image if present
            if 'image' in request.FILES:
                image_file = request.FILES['image']
                # Convert image to base64
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
                data['image'] = image_data
            
            # Convert boolean fields
            if 'Deep_think' in data:
                data['Deep_think'] = data['Deep_think'].lower() == 'true'
                
        elif request.content_type == 'application/json':
            data = json.loads(request.body.decode('utf-8'))
        else:
            return JsonResponse({
                'error': 'Unsupported content type',
                'details': 'Only multipart/form-data and application/json are supported'
            }, status=400)

        # Validate required fields
        if not data.get('question'):
            return JsonResponse({
                'error': 'Missing required field',
                'details': 'Question field is required'
            }, status=400)

        # Process the request
        response_data, status_code = async_to_sync(process_math_problem)(data)
        return JsonResponse(response_data, status=status_code)
            
    except Exception as e:
        logger.error(f"Error in solve_math_problem: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e),
            'details': 'An unexpected error occurred while processing your request.'
        }, status=500)

@api_view(['GET'])
def get_chat_history_by_user(request):
    """Get chat history for a specific user and session"""
    try:
        user_id = request.GET.get('user_id')
        session_id = request.GET.get('session_id')
        
        if not user_id:
            return Response({
                'error': 'User ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Query the chat history table with DISTINCT ON to remove duplicates
        with connections['default'].cursor() as cursor:
            cursor.execute("""
                WITH unique_chats AS (
                    SELECT DISTINCT ON (question, response) 
                        id, user_id, session_id, question, response, context, 
                        timestamp,
                        DATE(timestamp) as chat_date,
                        EXTRACT(WEEK FROM timestamp) as chat_week,
                        EXTRACT(MONTH FROM timestamp) as chat_month,
                        EXTRACT(YEAR FROM timestamp) as chat_year
                    FROM main_chathistory 
                    WHERE user_id = %s
                    AND (%s IS NULL OR session_id = %s)
                    ORDER BY question, response, timestamp DESC
                )
                SELECT * FROM unique_chats
                ORDER BY timestamp DESC
                LIMIT 100
            """, [user_id, session_id, session_id])
            
            rows = cursor.fetchall()
            
            # Group chats by time periods
            grouped_chats = {
                'today': [],
                'yesterday': [],
                'this_week': [],
                'this_month': [],
                'older': []
            }
            
            today = timezone.now().date()
            yesterday = today - timezone.timedelta(days=1)
            
            for row in rows:
                # Clean up the question content
                cleaned_question = row[3].replace('()', '') if row[3] else ''
                chat_date = row[7]  # chat_date from the query
                
                chat_entry = {
                    'id': row[0],
                    'user_id': row[1],
                    'session_id': row[2],
                    'question': cleaned_question,
                    'response': row[4],
                    'context': row[5],
                    'timestamp': row[6],
                    'preview': cleaned_question[:50] + ('...' if len(cleaned_question) > 50 else '')
                }
                
                # Add messages
                messages = []
                if chat_entry['question']:
                    messages.append({
                        'sender': 'user',
                        'content': cleaned_question,
                        'timestamp': chat_entry['timestamp']
                    })
                if chat_entry['response']:
                    messages.append({
                        'sender': 'assistant',
                        'content': chat_entry['response'],
                        'timestamp': chat_entry['timestamp']
                    })
                chat_entry['messages'] = messages
                
                # Group by date
                if chat_date == today:
                    grouped_chats['today'].append(chat_entry)
                elif chat_date == yesterday:
                    grouped_chats['yesterday'].append(chat_entry)
                elif chat_date.isocalendar()[1] == today.isocalendar()[1]:
                    grouped_chats['this_week'].append(chat_entry)
                elif chat_date.month == today.month and chat_date.year == today.year:
                    grouped_chats['this_month'].append(chat_entry)
                else:
                    grouped_chats['older'].append(chat_entry)
            
            # Format the response
            formatted_history = []
            if grouped_chats['today']:
                formatted_history.append({
                    'title': 'Today',
                    'chats': grouped_chats['today']
                })
            if grouped_chats['yesterday']:
                formatted_history.append({
                    'title': 'Yesterday',
                    'chats': grouped_chats['yesterday']
                })
            if grouped_chats['this_week']:
                formatted_history.append({
                    'title': 'This Week',
                    'chats': grouped_chats['this_week']
                })
            if grouped_chats['this_month']:
                formatted_history.append({
                    'title': 'This Month',
                    'chats': grouped_chats['this_month']
                })
            if grouped_chats['older']:
                formatted_history.append({
                    'title': 'Older',
                    'chats': grouped_chats['older']
                })
            
            return Response({
                'chat_history': formatted_history,
                'total_count': len(rows)
            })
            
    except Exception as e:
        logger.error(f"Error in get_chat_history_by_user: {str(e)}", exc_info=True)
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def handler(event, context):
    """AWS Lambda handler function"""
    from src.core.wsgi import application
    import awsgi
    
    return awsgi.response(application, event, context)