from django.conf import settings
from asgiref.sync import sync_to_async
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any
from pydantic import BaseModel, Field
import os

def get_openai_api_key():
    """Get OpenAI API key from settings"""
    return getattr(settings, 'OPENAI_API_KEY', os.getenv('OPENAI_API_KEY'))

class MathProblemInput(BaseModel):
    question: str = Field(description="The math problem to solve")
    approach: str = Field(description="The approach to use for solving")

class MathAgent:
    def __init__(self):
        api_key = get_openai_api_key()
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set")
            
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            api_key=api_key
        )
        self.chat_history = []
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

    async def solve(self, question: str, approach: str) -> Dict[str, Any]:
        """Solve math problem using specified approach"""
        try:
            # Create prompt template
            # 
            
            prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert JEE tutor specialized in Physics, Chemistry, and Mathematics.

            IMPORTANT GUIDELINES:
            1. For JEE-related questions, structure your responses as follows:
                - Clear section headings in bold
                - Step-by-step explanations with proper numbering
                - Important formulas/concepts in separate lines
                - Key points highlighted
                - Clean formatting with appropriate spacing

            2. For non-JEE questions:
                - Provide a brief, helpful response (1-2 sentences)
                - Politely redirect to JEE topics
                - Use this template:
                    "While I can briefly say that [short answer], I specialize in JEE preparation. 
                    I'd be happy to help you with JEE topics including:
                    
                    Physics:
                    • Mechanics
                    • Electromagnetism
                    • Thermodynamics
                    • Modern Physics
                    
                    Chemistry:
                    • Physical Chemistry
                    • Organic Chemistry
                    • Inorganic Chemistry
                    
                    Mathematics:
                    • Calculus
                    • Algebra
                    • Coordinate Geometry
                    • Trigonometry
                    
                    Feel free to ask any JEE-related questions!"

            Previous conversation context: {history}"""),

            ("human", """Question: {question}

            Approach Type: {approach}

            Guidelines for {approach}:
            {approach_guide}

            For JEE subject questions, structure the response as:

            **Concept Understanding**
            • Core concepts and principles
            • Relevant formulas/theories/reactions
            • Important definitions

            **Step-by-Step Solution**
            1. Problem breakdown
            2. Detailed solution steps
            3. Explanation of reasoning
            4. Units and dimensional analysis (where applicable)

            **Key Points to Remember**
            • Critical concepts
            • Common mistakes to avoid
            • Quick tips and tricks
            • Important exceptions/special cases

            **Similar Problem Types**
            • Related JEE questions
            • Pattern recognition
            • Variation approaches

            Please provide a detailed solution following this structure for JEE-related questions.""")
            ])

            # Prepare the messages
            messages = prompt.format_messages(
                history=self._format_history(),
                question=question,
                approach=approach,
                approach_guide=self.tools.get(approach, self.tools["step_by_step"])
            )

            # Get response from LLM
            response = await self.llm.ainvoke(messages)
            
            # Update chat history
            self.chat_history.extend([
                HumanMessage(content=question),
                AIMessage(content=response.content)
            ])
            
            # Keep only last 5 pairs of messages
            if len(self.chat_history) > 10:
                self.chat_history = self.chat_history[-10:]

            return {
                "solution": response.content,
                "context": self.chat_history,
                "approach_used": approach
            }

        except Exception as e:
            raise Exception(f"Error in agent execution: {str(e)}")
        

    def get_memory_usage(self) -> int:
        """Get current memory usage of the agent"""
        import sys
        return sys.getsizeof(self.chat_history)
    

    def _format_history(self) -> str:
        """Format chat history for prompt context"""
        if not self.chat_history:
            return "No previous context."
            
        formatted = []
        for msg in self.chat_history[-4:]:  # Last 2 exchanges
            role = "Student" if isinstance(msg, HumanMessage) else "Tutor"
            formatted.append(f"{role}: {msg.content}")
        
        return "\n".join(formatted)