import logging
import os
from typing import Optional
from asgiref.sync import sync_to_async
from openai import AsyncOpenAI  # Changed to AsyncOpenAI
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from main.models import ChatHistory
from django.conf import settings

logger = logging.getLogger(__name__)


def create_chat_model(model_type: str = "chat") -> AsyncOpenAI:
    """Create an AsyncOpenAI instance with appropriate API key based on model type."""
    if model_type == "reasoner":
        api_key = os.getenv('DEEPSEEK_REASONER_API_KEY')
        if not api_key:
            raise ValueError("DEEPSEEK_REASONER_API_KEY environment variable is not set")
    else:
        api_key = os.getenv('DEEPSEEK_CHAT_API_KEY')
        if not api_key:
            raise ValueError("DEEPSEEK_CHAT_API_KEY environment variable is not set")
    
    return AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com"
    )


@sync_to_async
def get_deepseek_api_key_async(model_type: str = "chat"):
    """Get DeepSeek API key from settings asynchronously based on model type"""
    if model_type == "reasoner":
        return getattr(settings, 'DEEPSEEK_REASONER_API_KEY', os.getenv('DEEPSEEK_REASONER_API_KEY'))
    return getattr(settings, 'DEEPSEEK_CHAT_API_KEY', os.getenv('DEEPSEEK_CHAT_API_KEY'))


class MathAgent:
    def __init__(self, chat_api_key: str, reasoner_api_key: str):
        try:
            if not chat_api_key or not reasoner_api_key:
                raise ValueError("Both DEEPSEEK_CHAT_API_KEY and DEEPSEEK_REASONER_API_KEY must be set")
                
            # Initialize two clients for different models
            self.chat_llm = AsyncOpenAI(
                api_key=chat_api_key,
                base_url="https://api.deepseek.com",
                temperature=0.7
            )
            self.reasoner_llm = AsyncOpenAI(
                api_key=reasoner_api_key,
                base_url="https://api.deepseek.com",
                temperature=0.7
            )
            
            self.chat_history = []
            self.max_history = 100
            
            self.interaction_prompts = {
                'explain': "Explain the concept in detail with examples.",
                'solve': "Solve this problem step by step.",
                'general': "Respond naturally to the query.",
            }
            logger.info("MathAgent initialized successfully with dual API keys")
        except Exception as e:
            logger.error(f"Error initializing MathAgent: {str(e)}")
            raise

    @classmethod
    async def create(cls):
        """Factory method to create a MathAgent instance with both API keys"""
        chat_api_key = await get_deepseek_api_key_async("chat")
        reasoner_api_key = await get_deepseek_api_key_async("reasoner")
        return cls(chat_api_key=chat_api_key, reasoner_api_key=reasoner_api_key)


    def _is_general_query(self, question: str) -> bool:
        """Check if the question is a general query about JEE preparation or assistance"""
        question_lower = question.lower()
        
        # Categories of general queries
        general_patterns = [
            'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
            'who are you', 'what can you do', 'help', 'how to prepare', 'study tips',
            'exam pattern', 'syllabus', 'strategy', 'books', 'materials', 'schedule'
        ]
        return any(pattern in question_lower for pattern in general_patterns)

    async def _get_general_response(self, question: str) -> Dict[str, Any]:
        """Generate dynamic LLM response for general queries"""
        try:
            # Use chat model for general queries
            messages = [
                {
                    "role": "system",
                    "content": """You are an advanced AI JEE preparation assistant. Respond naturally and helpfully to general queries about JEE preparation.
                    Keep responses:
                    1. Friendly and encouraging
                    2. Specific to JEE preparation
                    3. Actionable and practical
                    4. Structured with bullet points where appropriate
                    5. Focused on the student's needs"""
                },
                {
                    "role": "user",
                    "content": question
                }
            ]

            # Make API call
            response = await self.chat_llm.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                stream=False
            )

            solution = response.choices[0].message.content

            return {
                "solution": solution,
                "context": [
                    {"role": "user", "content": question},
                    {"role": "assistant", "content": solution}
                ],
                "approach_used": "dynamic_response"
            }

        except Exception as e:
            logger.error(f"Error in general response: {str(e)}")
            # Fallback response in case of error
            return {
                "solution": "I'm here to help with your JEE preparation. Could you please rephrase your question?",
                "context": [
                    {"role": "user", "content": question},
                    {"role": "assistant", "content": "Error handling response"}
                ],
                "approach_used": "fallback"
            }

    def _format_response(self, text: str) -> str:
        """Format the response to clean special characters and format math expressions."""
        try:
            # Replace markdown headers with clean text
            text = text.replace('# ', '').replace('## ', '').replace('### ', '')
            
            # Convert basic math operators to LaTeX
            replacements = {
                '*': '×',  # Replace * with × for multiplication
                '/': '÷',  # Replace / with ÷ for division
            }
            
            # Replace basic operators
            for old, new in replacements.items():
                text = text.replace(old, new)
            
            # Format mathematical expressions with LaTeX
            import re
            
            # Pattern for mathematical expressions
            math_patterns = [
                # Fractions like 1/2, a/b
                (r'(\d+|[a-z])\s*/\s*(\d+|[a-z])', r'\\frac{\1}{\2}'),
                # Square roots
                (r'sqrt\((.*?)\)', r'\\sqrt{\1}'),
                # Powers/exponents
                (r'(\d+|[a-z])\^(\d+|[a-z])', r'{\1}^{\2}'),
                # Equations with =
                (r'([^$])(=)([^$])', r'\1\\equals\3'),
            ]
            
            # Find potential mathematical expressions and wrap them in LaTeX delimiters
            for pattern, replacement in math_patterns:
                text = re.sub(pattern, lambda m: f'$${replacement}$$', text)
            
            # Clean up any remaining special characters
            text = text.replace('*', '•')  # Replace remaining * with bullet points
            
            return text
            
        except Exception as e:
            logger.error(f"Error formatting response: {str(e)}")
            return text  # Return original text if formatting fails

    async def solve(self, question: str, context: Dict[Any, Any]) -> dict:
        try:
            # Log the incoming request
            logger.info(f"Processing question: {question}")
            logger.info(f"Context received: {context}")

            if self._is_general_query(question):
                logger.info("Detected general query, getting dynamic response")
                return await self._get_general_response(question)

            user_id = context.get('user_id')
            session_id = context.get('session_id')
            subject = context.get('subject', '').lower()
            topic = context.get('topic', '')
            chat_history = context.get('chat_history', [])
            deep_think = context.get('Deep_think', False)

            # Select appropriate client and model based on Deep_think flag
            llm_client = self.reasoner_llm if deep_think else self.chat_llm
            model_name = "deepseek-reasoner" if deep_think else "deepseek-chat"
            logger.info(f"Using model: {model_name}")

            # Prepare messages for the API call
            messages = [
                {
                    "role": "system",
                    "content": f"""You are an advanced AI JEE preparation assistant with comprehensive knowledge of Physics, Chemistry, and Mathematics. You help students with:

                    1. Academic Support:
                    • Solving JEE-level problems step by step
                    • Explaining complex concepts with real-world examples
                    • Providing practice questions and mock tests
                    • Identifying and correcting conceptual mistakes
                    • Breaking down difficult topics into simpler parts

            2. Exam Strategy:
            • Time management techniques for JEE Main and Advanced
            • Question paper analysis and patterns
            • Marking scheme optimization
            • Quick solving methods and shortcuts
            • Common pitfalls to avoid during exams

            3. Study Planning:
            • Creating personalized study schedules
            • Suggesting revision strategies
            • Recommending best books and resources
            • Prioritizing topics based on importance
            • Managing study-life balance

            4. Previous Years' Analysis:
            • Explaining past year questions
            • Identifying important topics and trends
            • Providing difficulty level insights
            • Suggesting focus areas based on frequency

            5. Mental Preparation:
            • Stress management techniques
            • Concentration improvement tips
            • Memory enhancement methods
            • Motivation and confidence building
            • Exam day preparation tips

            Current context:
            Subject: {subject}
            Topic: {topic}
            Deep Think Mode: {"Enabled" if deep_think else "Disabled"}

            Response Guidelines:
            1. Keep responses simple and easy to read
            2. Use plain language and clear explanations
            3. Write mathematical expressions in a simple format
            4. Break down complex solutions into clear steps
            5. Use examples that are easy to understand
            6. Include practical tips when relevant
            7. {"Provide detailed analysis and advanced insights" if deep_think else "Keep explanations concise and straightforward"}

            Formatting Instructions:
            1. Write equations in simple text format (e.g., x^2 for squared)
            2. Use simple fractions (e.g., 1/2, 3/4)
            3. Write chemical formulas with numbers (e.g., H2O, CO2)
            4. Use -> for reactions and vectors
            5. Keep explanations structured with bullet points
            6. Avoid complex formatting or special characters"""
                            }
                        ]

            # Add chat history to messages
            for chat in chat_history:
                messages.append({"role": "user", "content": chat['question']})
                messages.append({"role": "assistant", "content": chat['response']})

            # Add current question
            messages.append({"role": "user", "content": question})

            logger.info(f"Sending request to DeepSeek API with {len(messages)} messages")

            # Make API call using selected client
            response = await llm_client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7 if deep_think else 0.5,
                max_tokens=2000,
                stream=False
            )

            logger.info("Received response from DeepSeek API")

            # Extract and format response content
            solution = self._format_response(response.choices[0].message.content)

            # Prepare return data
            result = {
                "solution": solution,
                "context": {
                    "current_question": question,
                    "response": solution,
                    "user_id": user_id,
                    "session_id": session_id,
                    "subject": subject,
                    "topic": topic,
                    "chat_history": chat_history,
                    "Deep_think": deep_think  # Include Deep_think status in response
                }
            }

            logger.info("Successfully processed request")
            return result

        except Exception as e:
            logger.error(f"Error in solve method: {str(e)}", exc_info=True)
            error_response = {
                "solution": "I apologize, but I encountered an error processing your request. Please try again.",
                "context": {
                    "current_question": question,
                    "response": f"Error occurred: {str(e)}",
                    "user_id": context.get('user_id'),
                    "session_id": context.get('session_id'),
                    "subject": context.get('subject', ''),
                    "topic": context.get('topic', ''),
                    "chat_history": context.get('chat_history', []),
                    "Deep_think": context.get('Deep_think', False)
                }
            }
            return error_response