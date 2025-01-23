from typing import Dict, Any
import logging
from asgiref.sync import sync_to_async
from openai import AsyncOpenAI
from contextlib import asynccontextmanager
import os
from main.models import ChatHistory

logger = logging.getLogger(__name__)

class ResponseTemplates:
    """Templates for system messages and response structures"""
    
    @staticmethod
    def get_interaction_prompt(interaction_type: str) -> str:
        """Get specific prompt based on interaction type"""
        prompts = {
            'explain': """Break down the concept step by step:
                1. Start with basic principles
                2. Explain each step clearly
                3. Show all calculations
                4. Connect concepts together
                5. Provide clear explanations""",
                
            'basics': """Explain the fundamental concepts:
                1. Core principles and definitions
                2. Basic formulas and their meaning
                3. Important relationships
                4. Prerequisites needed
                5. Common applications""",
                
            'test': """Create a mini-test to assess understanding:
                1. Start with basic concept questions
                2. Include numerical problems
                3. Add application-based questions
                4. Provide detailed solutions
                5. Give performance tips""",
                
            'similar': """Provide similar examples and variations:
                1. Show solved examples
                2. Explain different variations
                3. Increase complexity gradually
                4. Connect to other topics
                5. Practice problems""",
                
            'solve': """Solve the problem systematically:
                1. Identify given information
                2. List relevant formulas
                3. Show step-by-step solution
                4. Explain each step
                5. Verify the answer""",
                
            'keypoints': """Highlight the key points:
                1. Main concepts
                2. Important formulas
                3. Critical relationships
                4. Common mistakes to avoid
                5. Quick revision notes"""
        }
        return prompts.get(interaction_type, prompts['solve'])

    @staticmethod
    def get_selected_text_template(subject: str, topic: str, deep_think: bool, interaction_type: str) -> str:
        # Get interaction specific prompt
        interaction_prompt = ResponseTemplates.get_interaction_prompt(interaction_type)
        
        return f"""You are an expert JEE tutor. A student has selected the following text and has a question about it:

## Selected Text Context
{{selected_text}}

{interaction_prompt}

Please provide a {'comprehensive and advanced' if deep_think else 'clear and concise'} explanation:

## Concept Analysis
• {'Advanced theoretical background' if deep_think else 'Key concepts'} from the text
• {'Detailed mathematical foundations' if deep_think else 'Important formulas'}
• {'Complex relationships' if deep_think else 'Basic principles'}

## Detailed Explanation
1. {'Rigorous' if deep_think else 'Clear'} step-by-step breakdown
2. {'Advanced' if deep_think else 'Basic'} mathematical derivations
3. {'Deep insights and connections' if deep_think else 'Key relationships'}

## JEE Focus
• {'Advanced question patterns' if deep_think else 'Common question types'}
• {'Complex variations' if deep_think else 'Standard approaches'}
• {'Deep problem-solving strategies' if deep_think else 'Essential tips'}

Subject: {subject}
Topic: {topic}
Mode: {'Deep Analysis' if deep_think else 'Standard'}
Interaction Type: {interaction_type}"""

    @staticmethod
    def get_regular_template(subject: str, topic: str, deep_think: bool, interaction_type: str) -> str:
        # Get interaction specific prompt
        interaction_prompt = ResponseTemplates.get_interaction_prompt(interaction_type)
        
        return f"""You are an expert JEE tutor specialized in {subject.capitalize()}.

{interaction_prompt}

## Teaching Context
• Subject: {subject.capitalize()}
• Topic: {topic}
• Mode: {'Deep Analysis' if deep_think else 'Standard'}
• Interaction: {interaction_type}

Please provide a {'comprehensive and advanced' if deep_think else 'clear and focused'} response:

## Concept Overview
• {'Advanced theoretical framework' if deep_think else 'Main concepts'}
• {'Complex mathematical background' if deep_think else 'Basic principles'}
• {'Detailed derivations' if deep_think else 'Key formulas'}

## Solution Approach
1. {'Rigorous' if deep_think else 'Clear'} step-by-step solution
2. {'Advanced' if deep_think else 'Standard'} mathematical working
3. {'Detailed proofs' if deep_think else 'Key steps'} explained

## JEE Strategy
• {'Advanced level questions' if deep_think else 'Common patterns'}
• {'Complex variations' if deep_think else 'Standard types'}
• {'Deep insights' if deep_think else 'Basic approaches'}

## Practice Guide
• {'Advanced' if deep_think else 'Standard'} practice problems
• {'Complex' if deep_think else 'Basic'} variations
• {'Detailed' if deep_think else 'Simple'} solutions"""


class MathAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.templates = ResponseTemplates()
        self._setup_agent()

    @classmethod
    async def create(cls):
        """Factory method to create a MathAgent instance"""
        try:
            # Get API key from environment
            api_key = os.getenv('DEEPSEEK_CHAT_API_KEY')
            if not api_key:
                raise ValueError("DEEPSEEK_CHAT_API_KEY environment variable is not set")
            
            # Create instance
            return cls(api_key=api_key)
        except Exception as e:
            logger.error(f"Error creating MathAgent: {str(e)}")
            raise

    def _setup_agent(self):
        """Initialize agent settings"""
        if not self.api_key:
            raise ValueError("DEEPSEEK_CHAT_API_KEY is not set")
        self.chat_history = []
        self.max_history = 100

    @asynccontextmanager
    async def _get_client(self):
        """Context manager for API client"""
        client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://api.deepseek.com"
        )
        print("client created")
        try:
            yield client
        finally:
            await client.close()

    def _get_model_config(self, deep_think: bool) -> Dict[str, Any]:
        """Get model configuration based on mode"""
        return {
            "model": "deepseek-reasoner" if deep_think else "deepseek-chat",
            "temperature": 0.9 if deep_think else 0.7,
            "max_tokens": 3000 if deep_think else 2000,
            "stream": False
        }

    async def solve(self, question: str, context: Dict[Any, Any]) -> dict:
        try:
            logger.info(f"Processing question: {question}")
            logger.info(f"Context received: {context}")

            # Extract context
            context_data = self._extract_context(context)
            
            # Get system message
            system_message = self._get_system_message(context_data)
            
            # Prepare messages
            messages = self._prepare_messages(question, system_message, context_data)
            
            # Get model configuration
            model_config = self._get_model_config(context_data['deep_think'])

            # Make API call
            solution = await self._make_api_call(messages, model_config)
            
            # Save chat history
            await self._save_chat_history(question, solution, context_data)
            
            # Prepare response
            result = self._prepare_response(question, solution, context_data)

            logger.info("Successfully processed request")
            return result

        except Exception as e:
            logger.error(f"Error in solve method: {str(e)}", exc_info=True)
            return self._get_error_response(question, str(e), context)

    def _extract_context(self, context: Dict[Any, Any]) -> Dict[Any, Any]:
        """Extract and organize context data"""
        return {
            'user_id': context.get('user_id'),
            'session_id': context.get('session_id'),
            'selected_text': context.get('selectedText', ''),
            'subject': context.get('subject', '').lower(),
            'topic': context.get('topic', ''),
            'interaction_type': context.get('interaction_type', 'solve'),
            'deep_think': context.get('Deep_think', False),
            'chat_history': context.get('chat_history', [])
        }

    def _get_system_message(self, context_data: Dict[Any, Any]) -> str:
        """Get appropriate system message template"""
        template_func = (self.templates.get_selected_text_template 
                        if context_data['selected_text'] 
                        else self.templates.get_regular_template)
        
        return template_func(
            context_data['subject'],
            context_data['topic'],
            context_data['deep_think'],
            context_data['interaction_type']
        )

    def _prepare_messages(self, question: str, system_message: str, context_data: Dict[Any, Any]) -> list:
        """Prepare messages for API call"""
        messages = [{"role": "system", "content": system_message}]
        
        # Add chat history
        for chat in context_data['chat_history']:
            messages.extend([
                {"role": "user", "content": chat['question']},
                {"role": "assistant", "content": chat['response']}
            ])

        # Add current question
        question_content = (
            f"Based on this text: '{context_data['selected_text']}'\n\nQuestion: {question}"
            if context_data['selected_text']
            else question
        )
        messages.append({"role": "user", "content": question_content})
        
        return messages

    async def _make_api_call(self, messages: list, model_config: Dict[str, Any]) -> str:
        """Make API call and get response"""
        async with self._get_client() as client:
            response = await client.chat.completions.create(
                messages=messages,
                **model_config
            )
            return response.choices[0].message.content

    async def _save_chat_history(self, question: str, solution: str, context_data: Dict[Any, Any]):
        """Save interaction to chat history"""
        try:
            if context_data['user_id'] and context_data['session_id']:
                chat = await sync_to_async(ChatHistory.objects.create)(
                    user_id=context_data['user_id'],
                    session_id=context_data['session_id'],
                    question=question,
                    response=solution,
                    context={
                        'subject': context_data['subject'],
                        'topic': context_data['topic'],
                        'interaction_type': context_data['interaction_type'],
                        'selected_text': context_data['selected_text'],
                        'Deep_think': context_data['deep_think']
                    }
                )
                logger.info(f"Saved chat history for user {context_data['user_id']}")
        except Exception as e:
            logger.error(f"Error saving chat history: {str(e)}")
            # Don't raise the error to avoid breaking the main flow

    def _prepare_response(self, question: str, solution: str, context_data: Dict[Any, Any]) -> dict:
        """Prepare final response"""
        return {
            "solution": solution,
            "context": {
                "current_question": question,
                "response": solution,
                **context_data
            }
        }

    def _get_error_response(self, question: str, error: str, context: Dict[Any, Any]) -> dict:
        """Prepare error response"""
        return {
            "solution": "I apologize, but I encountered an error processing your request. Please try again.",
            "context": {
                "current_question": question,
                "response": f"Error occurred: {error}",
                "user_id": context.get('user_id'),
                "session_id": context.get('session_id'),
                "subject": context.get('subject', ''),
                "topic": context.get('topic', ''),
                "chat_history": context.get('chat_history', []),
                "selected_text": context.get('selectedText', ''),
                "interaction_type": context.get('interaction_type', 'solve'),
                "Deep_think": context.get('Deep_think', False)
            }
        }