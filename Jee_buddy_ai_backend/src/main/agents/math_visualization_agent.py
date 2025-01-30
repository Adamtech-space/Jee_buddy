from manim import *
import os
import asyncio
from typing import Dict, Any, Optional
import logging
from pathlib import Path
from openai import AsyncOpenAI
from supabase import create_client, Client
from datetime import datetime, timedelta
import shutil
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class ManimScriptGenerator:
    """Generates Manim animation scripts based on mathematical concepts"""
    
    def __init__(self):
        base_dir = Path(os.path.abspath(os.path.dirname(__file__)))
        self.script_dir = base_dir.parent.parent.parent / "manim_animations"
        # Clean up old files on initialization
        self._cleanup_directories()
        self.script_dir.mkdir(exist_ok=True)
        self.deepseek_key = os.getenv('DEEPSEEK_CHAT_API_KEY')
        self.openai_key = os.getenv('OPENAI_API_KEY')
        
    def _cleanup_directories(self):
        """Clean up old animation files and directories"""
        try:
            base_dir = Path(os.path.abspath(os.path.dirname(__file__)))
            media_dir = base_dir.parent.parent.parent / "media"
            animations_dir = base_dir.parent.parent.parent / "manim_animations"
            
            # Clean up media directory
            if media_dir.exists():
                shutil.rmtree(media_dir)
            media_dir.mkdir(parents=True, exist_ok=True)
            
            # Clean up animations directory
            if animations_dir.exists():
                for file in animations_dir.glob('*.py'):
                    if file.name != '__init__.py':
                        file.unlink()
                        
            logger.info("Successfully cleaned up directories")
            
        except Exception as e:
            logger.error(f"Error cleaning directories: {str(e)}")
        
    async def _generate_manim_script(self, concept: str, details: Dict[str, Any]) -> Optional[str]:
        """Generate Manim script using AI"""
        prompt = self._create_visualization_prompt(concept, details)
        
        try:
            # Try DeepSeek first
            try:
                client = AsyncOpenAI(
                    api_key=self.deepseek_key,
                    base_url="https://api.deepseek.com"
                )
                response = await client.chat.completions.create(
                    model="deepseek-chat",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=2000
                )
                return response.choices[0].message.content
                
            except Exception as e:
                logger.warning(f"DeepSeek API failed for visualization, falling back to GPT-3.5: {str(e)}")
                
                # Fallback to GPT-3.5
                async with AsyncOpenAI(api_key=self.openai_key) as openai_client:
                    response = await openai_client.chat.completions.create(
                        model="gpt-3.5",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.7,
                        max_tokens=2000
                    )
                    return response.choices[0].message.content
                    
        except Exception as e:
            logger.error(f"Both APIs failed for visualization generation: {str(e)}")
            return None
            
    def _find_existing_script(self, concept: str) -> Optional[str]:
        """Check if visualization already exists for concept"""
        concept_slug = concept.lower().replace(" ", "_")
        for script_file in self.script_dir.glob("*.py"):
            if concept_slug in script_file.stem.lower():
                return str(script_file)
        return None
        
    def _create_visualization_prompt(self, concept: str, details: Dict[str, Any]) -> str:
        """Create detailed prompt for AI to generate Manim script"""
        concept_lower = concept.lower()
        
        # Define concept-specific requirements
        specific_requirements = self._get_concept_requirements(concept_lower)
        
        base_prompt = f"""Create a detailed Manim animation script for teaching: {concept}

Specific Visualization Requirements:
{specific_requirements}

General Requirements:
1. Start with a title screen showing the concept name
2. Include step-by-step explanations with text labels
3. Use color coding to highlight important elements
4. Add mathematical formulas using MathTex
5. Include smooth transitions between steps
6. End with a summary or key points

Technical Requirements:
- Use Python Manim library syntax
- Create multiple scenes or sections if needed
- Use appropriate Manim objects (Text, MathTex, Geometry, etc.)
- Include proper animations (Write, FadeIn, Transform, etc.)
- Add appropriate wait times between animations
- Use consistent color scheme
- Include helpful comments in the code

Subject: {details.get('subject', 'Mathematics')}
Context: {details.get('question', '')}

Return only the Python code without any explanations."""
        return base_prompt

    def _get_concept_requirements(self, concept: str) -> str:
        """Get concept-specific visualization requirements"""
        # Dictionary of concept patterns and their visualization requirements
        concept_patterns = {
            'theorem': """
- Show the initial statement of the theorem
- Provide visual proof or demonstration
- Include step-by-step construction
- Show practical applications
- Add interactive elements""",
            
            'pythagoras': """
- Draw a right triangle with labeled sides (a, b, c)
- Show squares forming on each side
- Animate the area calculations
- Demonstrate the equality a² + b² = c²
- Include multiple examples with different triangle sizes
- Show real-world applications""",
            
            'trigonometry': """
- Start with the unit circle
- Show angle measurements
- Demonstrate sine, cosine, tangent relationships
- Include the relevant triangles
- Show wave form generations
- Include key angle values (30°, 45°, 60°)""",
            
            'calculus': """
- Show the function graph
- Demonstrate limits or derivatives
- Use tangent lines or area under curve
- Include rate of change visualization
- Show relationship between concepts""",
            
            'algebra': """
- Show equation transformations
- Use color coding for like terms
- Demonstrate step-by-step solutions
- Include graphical representations
- Show relationship between algebraic and geometric forms""",
            
            'geometry': """
- Start with basic shapes
- Show construction steps
- Include measurements and labels
- Demonstrate transformations
- Include proof visualization""",
            
            'function': """
- Show coordinate plane
- Plot the function graph
- Demonstrate key points (intercepts, extrema)
- Show transformations
- Include domain and range visualization""",
            
            'probability': """
- Show sample space
- Demonstrate events and outcomes
- Include tree diagrams or Venn diagrams
- Show probability calculations
- Include real-world examples""",
            
            'statistics': """
- Show data distribution
- Include mean, median, mode visualization
- Demonstrate standard deviation
- Show box plots or histograms
- Include data transformation steps""",
            
            'vector': """
- Show vector components
- Demonstrate vector operations
- Include coordinate system
- Show magnitude and direction
- Include practical applications""",
            
            'matrix': """
- Show matrix structure
- Demonstrate operations
- Include transformations
- Show determinant calculation
- Include practical applications"""
        }

        # Find matching pattern
        requirements = []
        for pattern, reqs in concept_patterns.items():
            if pattern in concept.lower():
                requirements.append(reqs)
        
        # If no specific pattern found, use general mathematics requirements
        if not requirements:
            requirements.append("""
- Show clear step-by-step visualization
- Include relevant formulas and equations
- Demonstrate practical applications
- Use appropriate mathematical notation
- Include examples and counter-examples""")
        
        return "\n".join(requirements)

    async def _generate_manim_script(self, concept: str, details: Dict[str, Any]) -> Optional[str]:
        """Generate Manim script content using AI"""
        try:
            prompt = self._create_visualization_prompt(concept, details)
            
            async with AsyncOpenAI(api_key=self.deepseek_key, base_url="https://api.deepseek.com") as client:
                response = await client.chat.completions.create(
                    model="deepseek-chat",
                    messages=[
                        {"role": "system", "content": """You are an expert in creating educational Manim animations. 
                            Create a complete Python script with these requirements:
                            1. Must include 'from manim import *'
                            2. Must define exactly one Scene class
                            3. Class name must be derived from the concept name
                            4. Must include a construct method
                            5. Use proper indentation (4 spaces)
                            Return only pure Python code without any markdown or text explanations."""},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=3000
                )
            
            if not response.choices or not response.choices[0].message.content:
                logger.error("No script content generated")
                return None

            script_content = response.choices[0].message.content.strip()
            
            # Validate script content format
            if not script_content or "class" not in script_content:
                logger.error("Invalid script content format")
                return None

            # Clean the script content
            script_content = self._clean_script_content(script_content)
            
            # Create class name from concept
            class_name = ''.join(x.title() for x in concept.split()) + 'Scene'
            
            # Create complete script with error handling
            complete_script = self._create_complete_script(concept, class_name, script_content)
            
            # Validate the complete script
            if not self._validate_script(complete_script):
                logger.error("Script validation failed")
                return None
            
            return complete_script
            
        except Exception as e:
            logger.error(f"Error generating Manim script: {str(e)}")
            return None

    def _create_complete_script(self, concept: str, class_name: str, script_content: str) -> str:
        """Create complete Manim script with proper structure and error handling"""
        return f"""from manim import *
import traceback

def create_textbox(text):
    return VGroup(
        Text(text),
        SurroundingRectangle(Text(text), buff=0.5)
    )

def create_highlighted_text(text, color=YELLOW):
    return Text(text, color=color)

class {class_name}(Scene):
    def construct(self):
        try:
            # Title
            title = Text("{concept}", font_size=48)
            self.play(Write(title))
            self.wait(2)
            self.play(FadeOut(title))

            # Main content with error handling
            {script_content}

        except Exception as e:
            # Handle any runtime errors
            error_text = Text(f"Error: {{str(e)}}", color=RED)
            self.play(Write(error_text))
            self.wait(2)
            logger.error(f"Animation error: {{str(e)}}")
            logger.error(traceback.format_exc())"""

    def _validate_script(self, script_content: str) -> bool:
        """Validate the generated script"""
        try:
            # Check for required components
            required_components = [
                'from manim import *',
                'class',
                'Scene',
                'def construct',
                'self.play'
            ]
            
            for component in required_components:
                if component not in script_content:
                    logger.error(f"Missing required component: {component}")
                    return False

            # Try to compile the script
            compile(script_content, '<string>', 'exec')
            
            return True
        except Exception as e:
            logger.error(f"Script validation error: {str(e)}")
            return False

    def _clean_script_content(self, content: str) -> str:
        """Clean and format the script content"""
        try:
            # Remove markdown and code block markers
            content = content.replace("```python", "").replace("```", "")
            
            # Split into lines and process each line
            lines = content.split('\n')
            cleaned_lines = []
            
            for line in lines:
                line = line.strip()
                # Skip empty lines and unwanted content
                if line and not any(line.startswith(x) for x in ['from', 'import', 'class', 'def construct']):
                    # Add proper indentation for content inside construct
                    cleaned_lines.append(' ' * 12 + line)  # Increased indentation for error handling block
            
            return '\n'.join(cleaned_lines)
            
        except Exception as e:
            logger.error(f"Error cleaning script content: {str(e)}")
            return ""

    def _save_script(self, concept: str, content: str) -> str:
        """Save generated script to file"""
        try:
            # Create filename from concept
            filename = f"{concept.lower().replace(' ', '_')}_visualization.py"
            file_path = self.script_dir / filename
            
            # Save content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error saving script: {str(e)}")
            raise

class StorageManager:
    """Manages video storage and cleanup in Supabase"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        self.bucket_name = 'manim-animations'
        self.client = create_client(self.supabase_url, self.supabase_key)
        
    async def upload_video(self, video_path: str) -> str:
        """Upload video to Supabase storage and return public URL"""
        try:
            file_name = os.path.basename(video_path)
            
            # Upload to Supabase
            with open(video_path, 'rb') as f:
                self.client.storage.from_(self.bucket_name).upload(
                    file_name,
                    f,
                    {'content-type': 'video/mp4'}
                )
            
            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(file_name)
            
            # Store metadata for cleanup
            await self._store_metadata(file_name)
            
            return public_url
            
        except Exception as e:
            logger.error(f"Error uploading video: {str(e)}")
            raise

    async def _store_metadata(self, file_name: str):
        """Store file metadata for cleanup"""
        expiry_date = datetime.now() + timedelta(days=2)
        self.client.table('animation_files').insert({
            'file_name': file_name,
            'created_at': datetime.now().isoformat(),
            'expiry_date': expiry_date.isoformat()
        }).execute()

    async def cleanup_expired_files(self):
        """Clean up expired files from storage and local directories"""
        try:
            # Get expired files
            response = self.client.table('animation_files').select('*').lt(
                'expiry_date', datetime.now().isoformat()
            ).execute()
            
            for record in response.data:
                # Remove from Supabase storage
                self.client.storage.from_(self.bucket_name).remove([record['file_name']])
                
                # Delete record
                self.client.table('animation_files').delete().eq(
                    'file_name', record['file_name']
                ).execute()
                
            # Clean up local directories
            await self._cleanup_local_files()
            
        except Exception as e:
            logger.error(f"Error in cleanup: {str(e)}")

    async def _cleanup_local_files(self):
        """Clean up local animation files and directories"""
        try:
            base_dir = Path(os.path.abspath(os.path.dirname(__file__)))
            media_dir = base_dir.parent.parent.parent / "media"
            animations_dir = base_dir.parent.parent.parent / "manim_animations"
            
            # Clean up media directory
            if media_dir.exists():
                shutil.rmtree(media_dir)
                media_dir.mkdir(exist_ok=True)
            
            # Clean up animations directory while preserving the directory
            if animations_dir.exists():
                for file in animations_dir.glob('*.py'):
                    if file.name != '__init__.py':
                        file.unlink()
                        
        except Exception as e:
            logger.error(f"Error cleaning local files: {str(e)}")

class ManimRenderer:
    """Handles rendering of Manim animations"""
    
    def __init__(self):
        base_dir = Path(os.path.abspath(os.path.dirname(__file__)))
        self.output_dir = base_dir.parent.parent.parent / "media" / "videos"
        # Clean up and recreate directories
        self._cleanup_and_setup_directories()
        self.storage_manager = StorageManager()
        self._setup_ffmpeg()
        
    def _cleanup_and_setup_directories(self):
        """Clean up and recreate necessary directories"""
        try:
            base_dir = Path(os.path.abspath(os.path.dirname(__file__)))
            media_dir = base_dir.parent.parent.parent / "media"
            
            # Remove old media directory
            if media_dir.exists():
                shutil.rmtree(media_dir)
            
            # Create fresh directories
            self.output_dir.mkdir(parents=True, exist_ok=True)
            logger.info("Successfully cleaned up and recreated directories")
            
        except Exception as e:
            logger.error(f"Error in directory setup: {str(e)}")
            
    async def render_animation(self, script_path: str) -> Optional[Dict[str, str]]:
        """Render Manim animation and upload to storage"""
        try:
            # Clean up before rendering
            self._cleanup_and_setup_directories()
            
            # Render animation
            video_path = await self._render_manim(script_path)
            if not video_path:
                return None
            
            # Upload to storage
            public_url = await self.storage_manager.upload_video(video_path)
            
            return {
                'local_path': video_path,
                'public_url': public_url
            }
            
        except Exception as e:
            logger.error(f"Error rendering animation: {str(e)}")
            return None
            
    async def _render_manim(self, script_path: str) -> Optional[str]:
        """Render Manim animation"""
        try:
            abs_script_path = os.path.abspath(script_path)
            abs_media_dir = os.path.abspath(str(self.output_dir.parent))
            
            # Get class name from script
            with open(abs_script_path, 'r', encoding='utf-8') as f:
                content = f.read()
                class_name = content.split('class ')[1].split('(Scene)')[0].strip()
            
            # Render with high quality settings
            cmd = f"manim -pqh --media_dir \"{abs_media_dir}\" \"{abs_script_path}\" {class_name}"
            
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=os.path.dirname(abs_script_path)
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"Manim render failed: {stderr.decode()}")
                return None
            
            # Find output video
            video_path = self._find_output_video(abs_script_path)
            if video_path:
                logger.info(f"Generated video at: {video_path}")
                return video_path
                
            logger.error("No video file found after rendering")
            return None
            
        except Exception as e:
            logger.error(f"Error in Manim rendering: {str(e)}")
            return None

    def _setup_ffmpeg(self):
        """Setup ffmpeg path"""
        if os.name == 'nt':  # Windows
            ffmpeg_path = Path(os.path.abspath(os.path.dirname(__file__))).parent.parent.parent / "ffmpeg" / "bin"
            if ffmpeg_path.exists():
                os.environ["PATH"] = f"{ffmpeg_path};{os.environ['PATH']}"
        
    def _find_output_video(self, script_path: str) -> Optional[str]:
        """Find rendered video file"""
        script_name = Path(script_path).stem
        for video_file in self.output_dir.glob(f"*{script_name}*.mp4"):
            return str(video_file)
        return None
async def generate_script(self, concept: str, details: Dict[str, Any]) -> Optional[str]:
    """Generate a Manim script for the given concept"""
    try:
        # Clean up old files before generating new ones
        self._cleanup_directories()
        
        # Check if visualization already exists
        existing_script = self._find_existing_script(concept)
        if existing_script:
            logger.info(f"Found existing visualization for {concept}")
            return existing_script
        
        # Generate new script using AI
        script_content = await self._generate_manim_script(concept, details)
        if not script_content:
            return None
            
        # Save script
        script_path = self._save_script(concept, script_content)
        logger.info(f"Generated new script at: {script_path}")
        return script_path
            
    except Exception as e:
        logger.error(f"Error generating visualization script: {str(e)}")
        return None

