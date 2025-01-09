from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class MathProblemInput(BaseModel):
    question: str = Field(description="The math problem to solve")
    approach: Optional[str] = Field(default="auto", description="The approach to use for solving")

class MathAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            temperature=0.7,
            model="gpt-3.5-turbo",
            max_tokens=1000,
            api_key="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"
        )
        self.chat_history = []
        self.max_history = 4
        self.tools = self._create_tools()

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
        for msg in self.chat_history[-4:]:  # Last 2 exchanges
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

    async def solve(self, question: str, approach: Optional[str] = None) -> Dict[str, Any]:
        """Solve math problem using specified or auto-detected approach"""
        try:
            if not question.strip():
                raise ValueError("Question cannot be empty")
            
            # Check if it's a general query
            if self._is_general_query(question):
                return self._get_general_response(question)

            # Auto-detect approach if not specified or if "auto"
            if not approach or approach == "auto":
                detected_approach = self._detect_approach(question)
                print(detected_approach)
                approach = detected_approach
                approach_source = "auto"
            elif approach not in self.tools:
                raise ValueError(f"Invalid approach. Must be one of: {list(self.tools.keys())} or 'auto'")
            else:
                approach_source = "specified"

            # Get history context
            history_context = self._format_history()
            if history_context != "No previous context.":
                question = f"Based on our previous discussion: {history_context}\n\nNew question: {question}"

            # Create messages
            messages = [
                SystemMessage(content=f"""You are an expert JEE tutor specialized in Physics, Chemistry, and Mathematics.
                
                Using {approach} approach for this question.
                
                Your response MUST follow this EXACT format:

                **Concept Understanding**
                • Key concepts
                • Important principles

                **Step-by-Step Solution**
                1. First step
                2. Second step

                **Key Points to Remember**
                • Important point 1
                • Important point 2

                **Similar Problem Types**
                • Related problem 1
                • Related problem 2

                Previous context:
                {history_context}
                """),
                HumanMessage(content=f"""Question: {question}
                Approach Guidelines: {self.tools[approach]}""")
            ]

            # Get response
            response = await self.llm.ainvoke(messages)
            
            # Validate and retry if needed
            if not self._validate_response(response.content):
                messages.append(SystemMessage(content="Please ensure your response follows the exact format specified."))
                response = await self.llm.ainvoke(messages)
            
            # Update chat history
            self.chat_history.extend([
                HumanMessage(content=question),
                AIMessage(content=response.content[:500])  # Limit stored response size
            ])
            
            # Keep only last N pairs of messages
            if len(self.chat_history) > self.max_history * 2:
                self.chat_history = self.chat_history[-(self.max_history * 2):]

            return {
                "solution": response.content,
                "context": self.chat_history[-4:],
                "approach_used": approach,
                "approach_detection": approach_source
            }

        except Exception as e:
            raise Exception(f"Error in agent execution: {str(e)}")

    def get_memory_usage(self) -> int:
        """Get current memory usage of the agent"""
        import sys
        return sys.getsizeof(self.chat_history)

    async def cleanup(self):
        """Cleanup resources"""
        self.chat_history.clear()