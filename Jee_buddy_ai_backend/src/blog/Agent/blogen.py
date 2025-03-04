import os
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from langchain_community.tools import DuckDuckGoSearchRun
from django.utils import timezone
from django.conf import settings
from blog.models import BlogPost
import logging
import random
from datetime import timedelta
from dotenv import load_dotenv
# from crewai.tools import DuckDuckGoSearchRun
# from crewai.tools import tool
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize tools - Create a custom Tool wrapper
search_tool_langchain = DuckDuckGoSearchRun()

class Tool:
    def __init__(self, name, description, func):
        self.name = name
        self.description = description
        self.func = func

search_tool = Tool(
    name="Search",
    description="Useful for searching the internet for information, news, data, etc.",
    func=lambda query: search_tool_langchain.run(query)
)

class BlogGenerator:
    def __init__(self):
        # Get the OpenAI API key
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")

        # Create the OpenAI model with the API key explicitly
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            api_key=self.openai_api_key
        )
        
        # Topics for JEE and other exams
        self.topics = [
            "JEE Advanced Physics preparation strategies",
            "JEE Main Chemistry important topics",
            "NEET Biology last-minute revision tips",
            "JEE Mathematics problem-solving techniques",
            "GATE Engineering exam preparation guide",
            "CAT Quantitative Aptitude shortcuts",
            "UPSC Prelims current affairs summary",
            "JEE Main vs Advanced: Key differences",
            "How to balance board exams and JEE preparation",
            "Memory techniques for JEE Chemistry formulas",
            "Physics experiments for JEE practical understanding",
            "Mathematics visualization techniques for JEE",
            "Time management strategies for competitive exams",
            "Mental health tips for JEE aspirants",
            "Best online resources for JEE preparation"
        ]
    
    def create_agents(self):
        # Research Agent
        researcher = Agent(
            role="Research Specialist",
            goal="Find the most relevant and up-to-date information on exam preparation topics",
            backstory="You are an expert researcher with deep knowledge of educational content and exam patterns. You know how to find the most valuable information for students.",
            verbose=True,
            allow_delegation=False,
            llm={"api_key": self.openai_api_key, "model": "gpt-3.5-turbo"}
        )
        
        # Content Writer
        writer = Agent(
            role="Content Writer",
            goal="Create engaging, informative, and SEO-optimized blog posts for exam preparation",
            backstory="You are a skilled content writer specializing in educational content. You know how to explain complex topics in simple terms while maintaining SEO best practices.",
            verbose=True,
            allow_delegation=False,
            llm={"api_key": self.openai_api_key, "model": "gpt-3.5-turbo"}
        )
        
        # SEO Specialist
        seo_specialist = Agent(
            role="SEO Specialist",
            goal="Optimize content for search engines to maximize visibility",
            backstory="You are an SEO expert who understands how to make content rank higher in search results. You know the latest SEO trends and techniques.",
            verbose=True,
            allow_delegation=False,
            llm={"api_key": self.openai_api_key, "model": "gpt-3.5-turbo"}
        )
        
        return researcher, writer, seo_specialist
    
    def create_tasks(self, researcher, writer, seo_specialist, topic):
        # Research Task
        research_task = Task(
            description=f"Research the topic '{topic}' thoroughly. Find the latest information, statistics, expert opinions, and useful resources. Focus on what students need to know for exam preparation.",
            agent=researcher,
            expected_output="A comprehensive research document with key points, facts, statistics, and resources on the topic."
        )
        
        # Writing Task
        writing_task = Task(
            description="Create a well-structured, engaging blog post based on the research. The post should be informative, easy to understand, and valuable for students. Include practical tips, examples, and actionable advice.",
            agent=writer,
            expected_output="A complete blog post with title, introduction, main content with subheadings, and conclusion.",
            context=[research_task]
        )
        
        # SEO Optimization Task
        seo_task = Task(
            description="Optimize the blog post for search engines. Ensure proper keyword usage, meta description, heading structure, and readability. Make suggestions to improve SEO without compromising quality.",
            agent=seo_specialist,
            expected_output="An SEO-optimized version of the blog post with meta description and SEO recommendations.",
            context=[writing_task]
        )
        
        return research_task, writing_task, seo_task
    
    def generate_blog(self):
        try:
            # Select a random topic
            topic = random.choice(self.topics)
            logger.info(f"Selected topic: {topic}")
            
            # Create agents
            researcher, writer, seo_specialist = self.create_agents()
            
            # Create tasks
            research_task, writing_task, seo_task = self.create_tasks(researcher, writer, seo_specialist, topic)
            
            # Create and run the crew
            crew = Crew(
                agents=[researcher, writer, seo_specialist],
                tasks=[research_task, writing_task, seo_task],
                verbose=2,
                process=Process.sequential
            )
            
            result = crew.kickoff()
            
            # Extract the second "Final Answer" (writer's content)
            blog_content = self.extract_second_final_answer(result)
            
            # Save to database
            self.save_blog_post(topic, blog_content)
            
            logger.info(f"Blog post on '{topic}' generated and saved successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error generating blog: {str(e)}")
            return False
    
    def extract_second_final_answer(self, result):
        """Extract the second 'Final Answer' from the result (writer's content)"""
        # Split by "Final Answer:"
        parts = result.split("Final Answer:")
        
        # If we have at least 3 parts (meaning 2 "Final Answer:" occurrences)
        if len(parts) >= 3:
            # Get the second "Final Answer:" content (index 2)
            content = parts[2].strip()
            
            # Find the next occurrence of ">" or "Finished chain" to get only this answer
            end_markers = ["\n>", "\nFinished chain"]
            for marker in end_markers:
                if marker in content:
                    content = content.split(marker)[0].strip()
            
            return content
        else:
            # Fallback to the last "Final Answer:" if there aren't enough
            return parts[-1].strip() if len(parts) > 1 else result
    
    def save_blog_post(self, topic, content):
        # Extract title from content if available
        title = topic
        if "Title:" in content:
            title_section = content.split("Title:")[1].split("\n")[0].strip()
            if title_section:
                title = title_section
        
        # Create a new blog post
        blog_post = BlogPost(
            title=title,
            content=content,
            created_at=timezone.now(),
            published_at=timezone.now(),  # Publish immediately
            is_published=True,  # Set to published
            author="AI Assistant",
            tags="JEE, Exam Preparation, Study Tips"
        )
        blog_post.save()
        logger.info(f"Blog post saved with ID: {blog_post.id}")

def schedule_blog_generation():
    """Function to be called by scheduler to generate a new blog post"""
    generator = BlogGenerator()
    success = generator.generate_blog()
    return success
