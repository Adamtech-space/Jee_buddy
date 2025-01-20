from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from .agents.math_agent_1 import MathAgent
import asyncio
import logging
import json
from .models import ChatHistory, UserProfile
import base64
import uuid
from django.db import connections
from asgiref.sync import async_to_sync
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

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

@csrf_exempt
@api_view(['POST'])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def solve_math_problem(request):
    try:
        logger.info(f"Received request data: {request.data}")
        
        # Extract data from request
        question = request.data.get('question')
        if not question:
            return Response({
                'error': 'Question is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle context data which might be string or dict
        context_data = request.data.get('context', {})
        if isinstance(context_data, str):
            try:
                context_data = json.loads(context_data)
            except json.JSONDecodeError:
                context_data = {}
        
        # Get user and session info
        user_id = context_data.get('user_id')
        session_id = context_data.get('session_id')
        history_limit = context_data.get('history_limit', 100)
        
        # Handle image if present
        image = request.FILES.get('image')
        image_content = None
        if image:
            image_content = base64.b64encode(image.read()).decode('utf-8')
        
        # Get chat history for the specific user and session
        chat_history = []
        if user_id and session_id:
            chat_history = ChatHistory.get_recent_history(
                user_id=user_id,
                session_id=session_id,
                limit=history_limit
            )
        
        # Create the context dictionary with all provided fields
        context = {
            'user_id': user_id,
            'session_id': session_id,
            'chat_history': chat_history,
            'history_limit': history_limit,
            'image': image_content,
            'interaction_type': context_data.get('interaction_type', 'solve'),
            'pinnedText': context_data.get('pinnedText', ''),
            'selectedText': context_data.get('selectedText', ''),
            'subject': context_data.get('subject', ''),
            'topic': context_data.get('topic', '')
        }
        
        if not question and not context['pinnedText']:
            return Response({
                'error': 'Either question or pinned text is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Initialize math agent
        agent = MathAgent()
        
        # Use async_to_sync to properly handle the async solve method
        solution = async_to_sync(agent.solve)(question, context)
        
        if not solution.get('solution'):
            return Response({
                'error': 'No solution generated',
                'details': 'The AI agent failed to generate a response.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save the interaction to history if user_id and session_id are present
        if user_id and session_id:
            try:
                ChatHistory.add_interaction(
                    user_id=user_id,
                    session_id=session_id,
                    question=question,
                    response=solution['solution'],
                    context={
                        'subject': context.get('subject'),
                        'topic': context.get('topic'),
                        'interaction_type': context.get('interaction_type'),
                        'pinned_text': context.get('pinnedText'),
                        'has_image': bool(image_content)
                    }
                )
            except Exception as db_error:
                logger.error(f"Database error: {str(db_error)}", exc_info=True)
        
        # Get updated chat history
        updated_chat_history = []
        if user_id and session_id:
            updated_chat_history = ChatHistory.get_recent_history(
                user_id=user_id,
                session_id=session_id,
                limit=history_limit
            )
        
        response_data = {
            'solution': solution['solution'],
            'context': {
                'history': updated_chat_history,
                'current_question': question,
                'response': solution['solution'],
                'user_id': user_id,
                'session_id': session_id,
                'subject': context.get('subject'),
                'topic': context.get('topic')
            }
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error in solve_math_problem: {str(e)}", exc_info=True)
        return Response({
            'error': str(e),
            'details': 'An unexpected error occurred while processing your request.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

