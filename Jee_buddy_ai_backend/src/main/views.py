from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .agents.math_agent_1 import MathAgent
import asyncio
import base64
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
import asyncio

    

@api_view(['POST'])
def solve_math_problem(request):
    question = request.data.get('question')
    approach_type = request.data.get('approach_type')
    print(question, approach_type)
    try:
        agent = MathAgent()
        result = asyncio.run(agent.solve(question, approach_type))
        
        return Response({
            'solution': result['solution'],
            'context': [
                {
                    'role': msg.type,
                    'content': msg.content
                } for msg in result['context']
            ],
            'approach_used': result['approach_used']
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

# @api_view(['POST'])
# @parser_classes([MultiPartParser, FormParser])
# def solve_math_problem(request):
#     question = request.data.get('question')
#     approach_type = request.data.get('approach_type', 'step_by_step')
#     image_file = request.FILES.get('image')
    
#     try:
#         # Convert image to base64 if provided
#         image_data = None
#         if image_file:
#             image_data = base64.b64encode(image_file.read()).decode('utf-8')
        
#         agent = MathAgent()
#         # Fix: Pass only three arguments
#         result = asyncio.run(agent.solve(question, approach_type, image_data))
        
#         return Response({
#             'solution': result['solution'],
#             'context': [
#                 {
#                     'role': 'user' if isinstance(msg, HumanMessage) else 'assistant',
#                     'content': msg.content
#                 } for msg in result['context']
#             ],
#             'approach_used': result['approach_used'],
#             'image_processed': result['image_processed']
#         })
        
#     except Exception as e:
#         return Response({
#             'error': str(e)
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)