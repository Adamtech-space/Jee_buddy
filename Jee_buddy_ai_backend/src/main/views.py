from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from .agents.math_agent_1 import MathAgent
import asyncio
import logging
import json
from .models import ChatHistory
import base64

logger = logging.getLogger(__name__)

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
        
        session_id = context_data.get('session_id', 'default')
        
        # Handle image if present
        image = request.FILES.get('image')
        image_content = None
        if image:
            image_content = base64.b64encode(image.read()).decode('utf-8')
        
        # Get chat history - now returns serializable dict
        chat_history = ChatHistory.get_recent_history(session_id)
        
        # Create the context dictionary
        context = {
            'selectedText': context_data.get('selectedText', ''),
            'pinnedText': context_data.get('pinnedText', ''),
            'subject': context_data.get('subject', ''),
            'topic': context_data.get('topic', ''),
            'image': image_content,
            'chat_history': chat_history,  # Now contains serializable data
            'interaction_type': context_data.get('interaction_type', 'general')
        }
        
        if not question and not context['pinnedText']:
            return Response({
                'error': 'Either question or pinned text is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            agent = MathAgent()
            result = asyncio.run(agent.solve(
                question=question,
                context=context
            ))
        except Exception as agent_error:
            logger.error(f"Agent error: {str(agent_error)}", exc_info=True)
            return Response({
                'error': f"Failed to process question: {str(agent_error)}",
                'details': 'The AI agent encountered an error while processing your request.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if not result.get('solution'):
            return Response({
                'error': 'No solution generated',
                'details': 'The AI agent failed to generate a response.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save the interaction to history
        try:
            ChatHistory.add_interaction(
                session_id=session_id,
                question=question,
                response=result['solution'],
                context=context
            )
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}", exc_info=True)
        
        # Refresh chat history after adding new interaction
        updated_chat_history = ChatHistory.get_recent_history(session_id)
        
        response_data = {
            'solution': result['solution'],
            'context': result['context'],
            'chat_history': updated_chat_history  # Using the serializable format
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return Response({
            'error': str(e),
            'details': 'An unexpected error occurred while processing your request.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

