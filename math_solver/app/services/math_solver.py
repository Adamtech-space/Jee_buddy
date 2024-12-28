from openai import AsyncOpenAI
from PIL import Image
import base64
import io
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class MathSolver:
    def __init__(self, api_key: str):
        """Initialize the Math Solver service"""
        self.client = AsyncOpenAI(api_key=api_key)

    async def encode_image(self, file) -> str:
        """Convert uploaded file to base64"""
        try:
            image = Image.open(file.file)
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
                model="gpt-4o",
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
                max_tokens=1000
            )
            
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Error in solution generation: {str(e)}")
            raise

    def _get_prompt(self) -> str:
        """Get the prompt template"""
        return """
        You are a math expert. Please:
        1. Identify the mathematical problem in the image
        2. Solve it step by step
        3. Explain the concepts used
        4. Provide the final answer
        
        Format your response clearly with proper headings and steps.
        """