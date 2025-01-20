from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import base64
from openai import OpenAI
import os

class MathAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.7,
            api_key=os.getenv('OPENAI_API_KEY')
        )
        self.chat_history = []
        self.tools = self._create_tools()
        self.client = OpenAI()

    def _create_tools(self) -> Dict[str, str]:
        return {
            "step_by_step": """Break down the problem into clear steps:
                1. Identify key components
                2. Apply relevant formulas
                3. Show calculations
                4. Explain each step""",
            # ... other tools remain the same ...
        }

    # Fix: Changed method signature to match the call
    async def solve(self, question: str, approach_type: str, image_data: Optional[str] = None) -> Dict[str, Any]:
        """Solve math problem using specified approach"""
        try:
            # Handle image if provided
            image_content = None
            if image_data:
                if image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                
                image_content = {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_data}"
                    }
                }

            # Create messages list
            messages = [
                {
                    "role": "system",
                    "content": f"""You are a JEE mathematics expert tutor.
                    Previous conversation context: {self._format_history()}"""
                }
            ]

            # Add user message with image if available
            user_content = []
            user_content.append({
                "type": "text",
                "text": f"""Question: {question}
                Approach: {approach_type}
                Guidelines: {self.tools.get(approach_type, self.tools['step_by_step'])}
                Please provide a detailed solution."""
            })

            if image_content:
                user_content.append(image_content)

            messages.append({
                "role": "user",
                "content": user_content
            })

            # Get response
            if image_content:
                response = await self.client.chat.completions.create(
                    model="gpt-4",
                    messages=messages,
                    max_tokens=1000
                )
                response_content = response.choices[0].message.content
            else:
                response = await self.llm.ainvoke(messages)
                response_content = response.content

            # Update chat history
            self.chat_history.extend([
                HumanMessage(content=f"{'[Image] ' if image_data else ''}{question}"),
                AIMessage(content=response_content)
            ])
            
            # Keep only last 5 pairs of messages
            if len(self.chat_history) > 10:
                self.chat_history = self.chat_history[-10:]

            return {
                "solution": response_content,
                "context": self.chat_history,
                "approach_used": approach_type,
                "image_processed": bool(image_data)
            }

        except Exception as e:
            raise Exception(f"Error in agent execution: {str(e)}")

    def _format_history(self) -> str:
        """Format chat history for prompt context"""
        if not self.chat_history:
            return "No previous context."
            
        formatted = []
        for msg in self.chat_history[-4:]:
            role = "Student" if isinstance(msg, HumanMessage) else "Tutor"
            formatted.append(f"{role}: {msg.content}")
        
        return "\n".join(formatted)