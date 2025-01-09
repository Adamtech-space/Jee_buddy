from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .agents.math_agent_1 import MathAgent
import asyncio
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def solve_math_problem(request):
    try:
        # Log incoming request data
        logger.info(f"Received request data: {request.data}")
        logger.info(f"Request headers: {request.headers}")
        
        question = request.data.get('question')
        context = request.data.get('context', {})
        
        # Extract context fields
        selected_text = context.get('selectedText', '')
        pinned_text = context.get('pinnedText', '')
        subject = context.get('subject', '')
        topic = context.get('topic', '')

        print(f"Selected Text: {selected_text}")
        print(f"Pinned Text: {pinned_text}")
        print(f"Subject: {subject}")
        print(f"Topic: {topic}")
        
        logger.info(f"Processing question: {question}")
        logger.info(f"Context: subject={subject}, topic={topic}")
        
        # Basic validation
        if not question:
            return Response({
                'error': 'Question is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Combine context into the question if provided
        if selected_text or pinned_text:
            question = f"Context: {selected_text} {pinned_text}\nQuestion: {question}"
        if subject:
            question = f"Subject: {subject}\n{question}"
        if topic:
            question = f"Topic: {topic}\n{question}"
            
        agent = MathAgent()
        # Pass only the supported parameters
        result = asyncio.run(agent.solve(
            question=question,
            approach="step_by_step"  # or "auto" if you want automatic detection
        ))
        
        logger.info("Successfully processed request")
        
        response_data = {
            'solution': result['solution'],
            'context': [
                {
                    'role': msg.type,
                    'content': msg.content
                } for msg in result['context']
            ],
            'approach_used': result['approach_used']
        }
        
        logger.info(f"Sending response: {response_data}")
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)