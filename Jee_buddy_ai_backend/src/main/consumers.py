# JEE_buddy/Jee_buddy_ai_backend/src/main/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .agents.math_agent import MathAgent
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.math_agent = await MathAgent.create()

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            question = data.get('question')
            context = data.get('context', {})

            # Process with MathAgent
            response = await self.math_agent.solve(question, context)

            # Send response back to WebSocket
            await self.send(text_data=json.dumps({
                'type': 'chat_message',
                'solution': response['solution'],
                'context': response['context']
            }))

        except Exception as e:
            logger.error(f"Error in WebSocket receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'An error occurred while processing your request.'
            }))

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))