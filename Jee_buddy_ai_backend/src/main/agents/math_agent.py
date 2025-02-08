from typing import Dict, Any, Optional
import logging
from asgiref.sync import sync_to_async
from openai import AsyncOpenAI
from contextlib import asynccontextmanager
import os
from main.models import ChatHistory
from pathlib import Path
from django.conf import settings
import uuid
import base64
from io import BytesIO
from .math_image_agent import MathSolver
from groq import Groq
from langchain.memory import ConversationBufferMemory



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


IMPORTANT: Provide the most concise response possible while maintaining accuracy and completeness. Use minimal tokens and avoid unnecessary explanations.
 

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


IMPORTANT: Be as concise as possible. Use the minimum number of tokens required to convey the information accurately. Avoid unnecessary explanations and focus on key points
 

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
        self.image_solver = MathSolver(api_key)
        self.memory = ConversationBufferMemory()

    @classmethod
    async def create(cls):
        api_key = os.getenv('GROQ_DEEPSEEK_API_KEY')
        if not api_key:
            raise ValueError("GROQ_DEEPSEEK_API_KEY environment variable is not set")
                
        # Create instance asynchronously
        return await sync_to_async(cls)(api_key=api_key)

    def _setup_agent(self):
        """Initialize agent settings"""
        if not self.api_key:
            raise ValueError("GROQ_DEEPSEEK_API_KEY is not set")
        self.chat_history = []
        self.max_history = 100


    @asynccontextmanager
    async def _get_client(self):
        """Context manager for API client"""
        client = None
        try:
            # Try Groq first
            client = Groq(api_key=self.api_key)
            print("Groq client created")
            yield client
        except Exception as e:
            logger.warning(f"Groq API failed, falling back to OpenAI: {str(e)}")
            openai_key = os.getenv('OPENAI_API_KEY')
            if not openai_key:
                raise ValueError("OPENAI_API_KEY environment variable is not set")
            
            # Initialize OpenAI client
            client = AsyncOpenAI(api_key=openai_key)
            print("OpenAI fallback client created")
            yield client
        finally:
            if client is not None:  # Ensure client is not None before closing
                client.close()
    def _get_model_config(self, deep_think: bool) -> Dict[str, Any]:
        """Get model configuration based on mode"""
        try:
            # Use DeepSeek models if deep_think is True
            if deep_think:
                return {
                    "model": "deepseek-r1-distill-llama-70b",  # Use the DeepSeek model
                    "temperature": 0.6,
                    "max_tokens": 3000,
                    "stream": False,
                }
            else:
                # Default to LLaMA models if deep_think is False
                return {
                    "model": "llama3-70b-8192",  # Use the LLaMA model
                    "temperature": 0.6,
                    "max_tokens": 2000,
                    "stream": False,
                }
        except Exception:
            # Fallback to OpenAI models
            return {
                "model": "gpt-4" if deep_think else "gpt-3.5-turbo-16k",
                "temperature": 0.9 if deep_think else 0.7,
                "max_tokens": 3000 if deep_think else 2000,
                "stream": False
            }



    async def _save_uploaded_image(self, base64_image: str) -> str:
        """Save base64 image and return the file path"""
        try:
            # Create media directory if it doesn't exist
            media_path = Path(settings.MEDIA_ROOT) / 'math_images'
            media_path.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            filename = f"math_image_{uuid.uuid4()}.png"
            file_path = media_path / filename
            
            # Decode and save image
            image_data = base64.b64decode(base64_image)
            with open(file_path, 'wb') as f:
                f.write(image_data)
            
            # Return relative path for database storage
            return f'math_images/{filename}'
            
        except Exception as e:
            logger.error(f"Error saving image: {str(e)}")
            raise

    async def solve(self, question: str, context: Dict[Any, Any]) -> dict:
        try:
            logger.info(f"Processing question: {question}")
            logger.info(f"question: {question}")
            logger.info(f"Context received: {context}")

            # Extract context first
            context_data = self._extract_context(context)

            self.memory.save_context({"input": question}, {"output": ""})
            
            # Get system message
            system_message = self._get_system_message(context_data)
            
            # Prepare messages
            messages = self._prepare_messages(question, system_message, context_data)
            
            # Get model configuration
            model_config = self._get_model_config(context_data['deep_think'])
            
            # print("messages", messages)
            # print("model_config", model_config)
            # print("context", context)
            # Make API call
            


            solution = await self._make_api_call(messages, model_config, context)
            self.memory.save_context({"input": question}, {"output": solution})
            print("solution", solution)

            
            # Prepare response
            response = {
                "solution": solution,
                "context": {
                    "current_question": question,
                    "response": solution,
                    **context_data
                }
            }
            
            return response

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
        
        # Add previous conversation from memory
        previous_memory = self.memory.load_memory_variables({})
        if previous_memory and 'history' in previous_memory:
            # Convert memory string to list of messages
            memory_entries = previous_memory['history'].split('\n')
            for entry in memory_entries:
                if 'Human:' in entry and 'AI:' in entry:
                    # Split into user and assistant messages
                    user_msg, assistant_msg = entry.split('AI:')
                    user_content = user_msg.replace('Human:', '').strip()
                    assistant_content = assistant_msg.strip()
                    
                    messages.append({"role": "user", "content": user_content})
                    messages.append({"role": "assistant", "content": assistant_content})

        # Add current question
        question_content = (
            f"Based on this text: '{context_data['selected_text']}'\n\nQuestion: {question}"
            if context_data['selected_text']
            else question
        )
        messages.append({"role": "user", "content": question_content})
        
        return messages


    async def _make_api_call(self, messages: list, model_config: Dict[str, Any], context: Dict[Any, Any] = None) -> str:
        """Make API call and get response"""
        last_error = None
        
        # Check if this is an image-based request
        is_image_request = bool(context and context.get('image'))
        
        # Handle image requests first
        if is_image_request:
            try:
                # Use the MathSolver to process the image
                image_data = context['image']
                solution = await self.image_solver.solve(image_data)
                return solution
            except Exception as image_error:
                logger.error(f"Image processing failed: {str(image_error)}")
                last_error = image_error
                # Fall through to text-based processing

        # Remove provider from config as it's not needed for the API call
        api_config = {k: v for k, v in model_config.items() if k != "provider"}
        
        # Try Groq first for deep think mode
        if model_config.get("provider") == "groq":
            try:
                # Disable streaming for now to avoid await issues
                api_config["stream"] = False
                
                # Make the Groq API call synchronously (no await)
                response = self.groq_client.chat.completions.create(
                messages=messages,
                model=model_config["model"],  # Pass model here
                **api_config
            )
                return response.choices[0].message.content
            except Exception as groq_error:
                logger.warning(f"Groq API failed, falling back to DeepSeek: {str(groq_error)}")
                last_error = groq_error

        # For non-image requests, proceed with the API call
        if not is_image_request:
            try:
                async with self._get_client() as client:
                    try:
                        response = client.chat.completions.create(
                            messages=messages,
                            **model_config
                        )
                        
                        if not response or not response.choices:
                            raise ValueError("Empty response received from API")
                            
                        return response.choices[0].message.content
                    except Exception as api_error:
                        last_error = api_error
                        logger.error(f"Groq API call failed: {str(api_error)}")
                        raise
            except Exception as e:
                logger.warning(f"Groq API failed, falling back to OpenAI: {str(e)}")

        
        # For image requests or if Groq fails, use OpenAI
        try:
            openai_key = os.getenv('OPENAI_API_KEY')
            if not openai_key:
                raise ValueError("OPENAI_API_KEY environment variable is not set")
            
            # Update model config for OpenAI
            openai_config = {
                # Use GPT-4 models for image requests, otherwise use fallback config
                "model": "gpt-4-turbo" if is_image_request else (
                    "deepseek-chat" if model_config.get("model") == "deepseek-reasoner" 
                    else "gpt-3.5-turbo-16k"
                ),
                "temperature": model_config.get("temperature", 0.7),
                "max_tokens": model_config.get("max_tokens", 380),
                "stream": False
            }
            # print("openai_config", openai_config)
            # print("messages", messages)
            async with AsyncOpenAI(api_key=openai_key) as openai_client:
                response = await openai_client.chat.completions.create(
                    messages=messages,
                    **openai_config
                )
                
                if not response or not response.choices:
                    raise ValueError("Empty response received from OpenAI API")
                    
                return response.choices[0].message.content
                
        except Exception as openai_error:
            error_msg = f"API calls failed. "
            if last_error:
                error_msg += f"Groq error: {last_error}, "
            error_msg += f"OpenAI error: {openai_error}"
            logger.error(error_msg)
            raise ValueError(error_msg)

    async def _save_chat_history(self, question: str, solution: str, context_data: Dict[Any, Any]):
        """Save interaction to chat history"""
        try:
            if context_data['user_id'] and context_data['session_id']:
                # Create context dictionary with all necessary data
                context_dict = {
                    'subject': context_data['subject'],
                    'topic': context_data['topic'],
                    'interaction_type': context_data['interaction_type'],
                    'selected_text': context_data['selected_text'],
                    'Deep_think': context_data['deep_think']
                }

                # Create chat history entry
                chat = await sync_to_async(ChatHistory.objects.create)(
                    user_id=context_data['user_id'],
                    session_id=context_data['session_id'],
                    question=question,
                    response=solution,
                    context=context_dict
                )
                logger.info(f"Saved chat history for user {context_data['user_id']}")
        except Exception as e:
            logger.error(f"Error saving chat history: {str(e)}")

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
                "Deep_think": context.get('Deep_think', False),
                "image_path": context.get('image_path', '')
            }
        }
