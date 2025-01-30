from openai import AsyncOpenAI
from PIL import Image
import base64
import io
from typing import Optional
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class MathSolver:
    def __init__(self, api_key: str):
        """Initialize the Math Solver service"""
        self.client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))  # Always use OpenAI for images

    async def encode_image(self, file) -> str:
        """Convert uploaded file to base64"""
        try:
            image = Image.open(file)
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode('utf-8')
        except Exception as e:
            logger.error(f"Error encoding image: {str(e)}")
            raise ValueError("Invalid image file")

    async def solve(self, file) -> Optional[str]:
        """Process image and return solution"""
        try:
            base64_image = await self.encode_image(file)
            
            response = await self.client.chat.completions.create(
                model="gpt-4-vision-preview",  # Use vision model
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": self._get_prompt()
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4096
            )
            
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Error in solution generation: {str(e)}")
            raise

    def _get_prompt(self) -> str:
        """Get the prompt template"""
        return """
        You are a JEE expert tutor. Analyze this math/physics problem image and provide:

        1. PROBLEM IDENTIFICATION
        - Clearly state what the problem is asking
        - Identify key information given
        - Note any relevant formulas or concepts needed

        2. STEP-BY-STEP SOLUTION
        - Break down the solution into clear steps
        - Show all calculations and working
        - Explain each step's reasoning
        - Include relevant formulas and their application

        3. CONCEPTS USED
        - List all mathematical/physical concepts involved
        - Explain how these concepts connect
        - Mention any important theorems or principles

        4. FINAL ANSWER
        - State the final answer clearly
        - Include units if applicable
        - Verify the answer makes sense

        5. JEE TIPS
        - Note common variations of this problem type
        - Highlight key points for JEE exam perspective
        - Mention any shortcuts or tricks

        Format your response using these exact headings for clarity.
        """