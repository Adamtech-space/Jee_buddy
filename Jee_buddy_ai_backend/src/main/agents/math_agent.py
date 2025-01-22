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


def create_chat_model() -> AsyncOpenAI:
    """Create an AsyncOpenAI instance with clean configuration."""
    api_key = os.getenv('DEEPSEEK_API_KEY')
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY environment variable is not set")
    
    return AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com"
    )


class MathProblemInput(BaseModel):
    question: str = Field(description="The math problem to solve")
    approach: Optional[str] = Field(default="auto", description="The approach to use for solving")


@sync_to_async
def get_deepseek_api_key_async():
    """Get DeepSeek API key from settings asynchronously"""
    return getattr(settings, 'DEEPSEEK_API_KEY', os.getenv('DEEPSEEK_API_KEY'))


class MathAgent:
    def __init__(self, api_key: str):
        try:
            if not api_key:
                raise ValueError("DEEPSEEK_API_KEY is not set")
                
            self.llm = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.deepseek.com"
            )
            self.chat_history = []
            self.max_history = 100
            self.tools = self._create_tools()
            self.interaction_prompts = {
                'explain': "Explain the concept in detail with examples.",
                'solve': "Solve this problem step by step.",
                'general': "Respond naturally to the query.",
            }
            logger.info("MathAgent initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing MathAgent: {str(e)}")
            raise

    @classmethod
    async def create(cls):
        """Factory method to create a MathAgent instance"""
        api_key = await get_deepseek_api_key_async()
        return cls(api_key=api_key)

    def _create_tools(self) -> Dict[str, str]:
        return {
            "step_by_step": """Break down the problem into clear steps:
                1. Identify key components
                2. Apply relevant formulas
                3. Show calculations
                4. Explain each step""",
                
            "basics": """Explain fundamental concepts:
                1. Core mathematical principles
                2. Required formulas
                3. Key definitions
                4. Prerequisites""",
                
            "examples": """Provide similar problems:
                1. Solved example
                2. Step-by-step solution
                3. Variations of the problem
                4. Practice problems""",
                
            "mistakes": """Analyze common errors:
                1. Typical mistakes
                2. Why they occur
                3. How to avoid them
                4. Verification steps"""
        }

    def _detect_approach(self, question: str) -> str:
        """Automatically detect the best approach based on question content"""
        question_lower = question.lower()
        
        keywords = {
            "step_by_step": [
                "solve", "calculate", "find", "evaluate", "determine",
                "compute", "derive", "what is the value", "find the value"
            ],
            "basics": [
                "explain", "what is", "define", "concept", "understand",
                "describe", "elaborate", "clarify", "how does", "why is"
            ],
            "examples": [
                "example", "similar", "practice", "show me", "demonstrate",
                "illustrate", "give an instance", "sample", "like"
            ],
            "mistakes": [
                "mistake", "error", "wrong", "incorrect", "avoid",
                "common problem", "pitfall", "caution", "warning", "be careful"
            ]
        }
        
        matches = {
            approach: sum(1 for word in words if word in question_lower)
            for approach, words in keywords.items()
        }
        
        best_approach = max(matches.items(), key=lambda x: x[1])[0]
        return best_approach if matches[best_approach] > 0 else "step_by_step"

    def _validate_response(self, response: str) -> bool:
        """Validate the quality and format of the response"""
        required_sections = [
            "**Concept Understanding**",
            "**Step-by-Step Solution**",
            "**Key Points to Remember**",
            "**Similar Problem Types**"
        ]
        
        if not all(section in response for section in required_sections):
            return False
            
        if not ("•" in response and "**" in response):
            return False
            
        if not (200 <= len(response) <= 2500):
            return False
            
        return True

    def _format_history(self) -> str:
        """Format chat history for prompt context"""
        if not self.chat_history:
            return "No previous context."
            
        formatted = []
        for msg in self.chat_history[-100:]:
            role = "user" if msg["role"] == "user" else "assistant"
            content = msg["content"][:300]
            formatted.append(f"{role}: {content}")
        
        return "\n".join(formatted)

    def _is_general_query(self, question: str) -> bool:
        """Check if the question is a general query or greeting"""
        general_patterns = [
            'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
            'how are you', 'what can you do', 'help', 'who are you'
        ]
        return any(pattern in question.lower() for pattern in general_patterns)

    def _get_general_response(self, question: str) -> Dict[str, Any]:
        """Generate a friendly response for general queries"""
        greetings = {
            'hi': "Hi! 👋 I'm your JEE study assistant. I can help you with Physics, Chemistry, and Mathematics problems. Would you like to:\n\n• Solve a specific JEE problem?\n• Understand a concept?\n• Practice with example questions?\n\nJust ask me anything related to JEE preparation!",
            'hello': "Hello! 👋 I'm here to help with your JEE preparation. What subject would you like to focus on - Physics, Chemistry, or Mathematics?",
            'help': "I'm your JEE study assistant! I can help you:\n\n• Solve JEE problems step by step\n• Explain complex concepts\n• Provide practice questions\n• Share exam tips and strategies\n\nWhat would you like help with?",
            'default': "Hello! 👋 I'm your JEE study assistant. I specialize in Physics, Chemistry, and Mathematics. How can I help you with your JEE preparation today?"
        }

        for key in greetings:
            if key in question.lower():
                response = greetings[key]
                break
        else:
            response = greetings['default']

        return {
            "solution": response,
            "context": [
                {"role": "user", "content": question},
                {"role": "assistant", "content": response[:500]}
            ],
            "approach_used": "greeting"
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
                logger.info("Detected general query, returning greeting response")
                return self._get_general_response(question)

            user_id = context.get('user_id')
            session_id = context.get('session_id')
            subject = context.get('subject', '').lower()
            topic = context.get('topic', '')
            selected_text = context.get('selectedText', '')
            pinned_text = context.get('pinnedText', '')
            chat_history = context.get('chat_history', [])

            # Create context message based on selected text
            context_message = ""
            if selected_text:
                context_message = f"""
The user is asking about this selected text:
{selected_text}

Please provide a detailed explanation about this topic, focusing on:
1. The main concept being discussed
2. Historical context if mentioned
3. Key principles and laws involved
4. Applications and significance
5. Related JEE concepts and questions

If the user's question is specific, address it in the context of this selected text.
"""

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

{context_message if selected_text else ""}

Response Guidelines:
1. Keep responses simple and easy to read
2. Use plain language and clear explanations
3. Write mathematical expressions in a simple format
4. Break down complex solutions into clear steps
5. Use examples that are easy to understand
6. Include practical tips when relevant

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

            # Add current question with context if there's selected text
            if selected_text:
                question_with_context = f"Question: {question}\nRegarding this text: {selected_text}"
                messages.append({"role": "user", "content": question_with_context})
            else:
                messages.append({"role": "user", "content": question})

            logger.info(f"Sending request to DeepSeek API with {len(messages)} messages")

            # Make API call
            response = await self.llm.chat.completions.create(
                model="deepseek-reasoner",
                messages=messages,
                temperature=0.7,
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
                    "chat_history": chat_history
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
                    "chat_history": context.get('chat_history', [])
                }
            }
            return error_response