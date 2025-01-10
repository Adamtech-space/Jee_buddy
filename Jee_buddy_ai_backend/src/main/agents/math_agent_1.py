import logging
import os
logger = logging.getLogger(__name__)

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain.schema import SystemMessage, HumanMessage
from main.models import ChatHistory
class MathProblemInput(BaseModel):
    question: str = Field(description="The math problem to solve")
    approach: Optional[str] = Field(default="auto", description="The approach to use for solving")

class MathAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            temperature=0.7,
            model="gpt-4o",
            max_tokens=1000,
            api_key=os.getenv('OPENAI_API_KEY')
        )
        self.chat_history = []
        self.max_history = 100
        self.tools = self._create_tools()
        self.interaction_prompts = {
            'explain': "Explain the concept in detail with examples.",
            'solve': "Solve this problem step by step.",
            'general': "Respond naturally to the query.",
        }

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
        
        # Enhanced keywords for better detection
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
        
        # Count keyword matches for each approach
        matches = {
            approach: sum(1 for word in words if word in question_lower)
            for approach, words in keywords.items()
        }
        
        # Return the approach with most matches, default to step_by_step
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
        
        # Check sections with exact formatting
        if not all(section in response for section in required_sections):
            return False
            
        # Check formatting
        if not ("•" in response and "**" in response):
            return False
            
        # Check length
        if not (200 <= len(response) <= 2500):
            return False
            
        return True

    def _format_history(self) -> str:
        """Format chat history for prompt context"""
        if not self.chat_history:
            return "No previous context."
            
        formatted = []
        for msg in self.chat_history[-100:]:  # Last 100 exchanges
            role = "Student" if isinstance(msg, HumanMessage) else "Tutor"
            content = msg.content[:300]  # Limit content length
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

        # Get appropriate greeting or default response
        for key in greetings:
            if key in question.lower():
                response = greetings[key]
                break
        else:
            response = greetings['default']

        return {
            "solution": response,
            "context": [
                HumanMessage(content=question),
                AIMessage(content=response[:500])
            ],
            "approach_used": "greeting"
        }

    async def solve(self, question: str, context: Dict[Any, Any]) -> dict:
        try:

            # Get user and session info
            user_id = context.get('user_id')
            session_id = context.get('session_id')
            history_limit = context.get('history_limit', 100)

             # Get chat history from database
            history_context = ""
            if user_id:
                # Get last 5 interactions regardless of session
                db_history = ChatHistory.objects.filter(
                    user_id=user_id
                ).order_by('-timestamp')[:history_limit]  # Adjust number as needed
                
                if db_history:
                    history_context = "\n".join([
                        f"User: {h.question}\nAssistant: {h.response}"
                        for h in db_history
                    ])
                else:
                    history_context = "No previous conversation context."
            # Process image if present
            image_context = ""
            if context.get('image'):
                image_context = "[Image provided for reference]"

            # # Build conversation history context
            # history_context = ""
            # if context.get('chat_history'):
            #     history_context = "\n".join([
            #         f"User: {msg['question']}\nAssistant: {msg['response']}"
            #         for msg in context['chat_history']
            #     ])

           

            messages = [
                SystemMessage(content=f"""You are an expert friendly JEE tutor specialized in Physics, Chemistry, and Mathematics.
                
                Previous conversation context:
                {history_context}

                Additional context:
                {context.get('pinnedText', '')}
                {image_context}
                If the user asks about previous conversations or history, please summarize the above context.
                Format your response with clear sections using markdown.
                Include specific details {history_context} from previous questions and their solutions.
                """),
                HumanMessage(content=question)
            ]

            # Actually call the LLM
            response = await self.llm.agenerate([messages])
            
            # Extract the response
            llm_response = response.generations[0][0].text

             # Store interaction in database
            if user_id and session_id:
                ChatHistory.add_interaction(
                    user_id=user_id,
                    session_id=session_id,
                    question=question,
                    response=llm_response,
                    context={
                        'pinned_text': context.get('pinnedText', ''),
                        'has_image': bool(context.get('image')),  
                    }
                )            
            return {
                'solution': llm_response,
                'context': {
                    'history': history_context,
                    'current_question': question,
                    'response': llm_response,
                    'previous_interactions': history_context

                }
                
            }

        except Exception as e:
            logger.error(f"Error in MathAgent solve method: {str(e)}", exc_info=True)
            raise Exception(f"Failed to process question: {str(e)}")

