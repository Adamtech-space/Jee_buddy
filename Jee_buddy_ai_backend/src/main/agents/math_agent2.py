from django.conf import settings
from asgiref.sync import sync_to_async
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain.memory import ConversationBufferWindowMemory, ConversationSummaryMemory
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import SupabaseVectorStore
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from supabase import create_client, Client
from datetime import datetime
import json
import os

def get_openai_api_key():
    """Get OpenAI API key from settings"""
    return getattr(settings, 'OPENAI_API_KEY', os.getenv('OPENAI_API_KEY'))

def get_supabase_config():
    """Get Supabase configuration from settings"""
    return {
        'url': getattr(settings, 'SUPABASE_URL', os.getenv('SUPABASE_URL')),
        'key': getattr(settings, 'SUPABASE_KEY', os.getenv('SUPABASE_KEY'))
    }

class MathProblemInput(BaseModel):
    question: str = Field(description="The math problem to solve")
    approach: Optional[str] = Field(default="auto", description="The approach to use for solving")

class MathAgent:
    def __init__(self):
        # Get API keys and configuration
        api_key = get_openai_api_key()
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set")
            
        supabase_config = get_supabase_config()
        if not all(supabase_config.values()):
            raise ValueError("Supabase configuration is incomplete")
            
        # Initialize Supabase client
        self.supabase: Client = create_client(
            supabase_url=supabase_config['url'],
            supabase_key=supabase_config['key']
        )
        
        # Initialize OpenAI components
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo-16k",
            temperature=0.7,
            api_key=api_key
        )
        
        # Initialize embeddings and vector store
        self.embeddings = OpenAIEmbeddings(openai_api_key=api_key)
        self.vector_store = SupabaseVectorStore(
            client=self.supabase,
            embedding=self.embeddings,
            table_name="math_conversations",
            query_name="match_math_conversations"
        )
        
        # Initialize memory systems
        self.window_memory = ConversationBufferWindowMemory(
            k=5,
            return_messages=True
        )
        self.summary_memory = ConversationSummaryMemory(
            llm=self.llm,
            return_messages=True
        )
        
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
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

    def _extract_topics(self, text: str) -> List[str]:
        """Extract mathematical topics from text"""
        topics_keywords = {
            "calculus": ["integral", "derivative", "differential", "integration"],
            "mechanics": ["velocity", "acceleration", "force", "motion"],
            "vectors": ["vector", "direction", "magnitude", "component"],
            "geometry": ["curve", "trajectory", "radius", "angle"],
            "algebra": ["equation", "solve", "polynomial", "factor"],
            "physics": ["energy", "momentum", "work", "power"]
        }
        
        found_topics = []
        text_lower = text.lower()
        
        for topic, keywords in topics_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                found_topics.append(topic)
                
        return found_topics

    def _assess_complexity(self, text: str) -> str:
        """Assess problem complexity"""
        complexity_indicators = {
            "advanced": ["curvature", "differential equation", "vector field", "complex"],
            "intermediate": ["integration", "derivative", "velocity", "function"],
            "basic": ["solve", "find", "calculate", "simple"]
        }
        
        text_lower = text.lower()
        for level, indicators in complexity_indicators.items():
            if any(indicator in text_lower for indicator in indicators):
                return level
        return "basic"

    async def _store_interaction(self, question: str, answer: str, metadata: Dict) -> None:
        """Store interaction with embeddings"""
        try:
            combined_text = f"Q: {question}\nA: {answer}"
            embedding = await self.embeddings.aembed_query(combined_text)
            
            data = {
                "session_id": self.session_id,
                "question": question,
                "answer": answer,
                "embedding": embedding,
                "metadata": metadata,
                "timestamp": datetime.now().isoformat(),
                "topics": self._extract_topics(combined_text),
                "complexity": self._assess_complexity(combined_text)
            }
            
            self.supabase.table("math_conversations").insert(data).execute()
            
            # Update memories
            self.window_memory.save_context(
                {"input": question},
                {"output": answer}
            )
            self.summary_memory.save_context(
                {"input": question},
                {"output": answer}
            )
            
        except Exception as e:
            print(f"Error storing interaction: {e}")

    async def _get_relevant_context(self, current_question: str) -> Dict[str, Any]:
        """Get relevant context using semantic search"""
        try:
            # Get question embedding
            question_embedding = await self.embeddings.aembed_query(current_question)
            
            # Search for similar conversations
            similar_conversations = self.vector_store.similarity_search_with_score(
                current_question,
                k=5
            )
            
            # Get recent window context
            window_context = self.window_memory.load_memory_variables({})
            
            # Get conversation summary
            summary_context = self.summary_memory.load_memory_variables({})
            
            return {
                "similar_conversations": similar_conversations,
                "recent_context": window_context,
                "conversation_summary": summary_context
            }
            
        except Exception as e:
            print(f"Error retrieving context: {e}")
            return {}

    def _detect_approach(self, question: str) -> str:
        """Automatically detect the best approach based on question content"""
        question_lower = question.lower()
        
        keywords = {
            "step_by_step": [
                "solve", "calculate", "find", "evaluate", "determine",
                "compute", "derive", "what is the value"
            ],
            "basics": [
                "explain", "what is", "define", "concept", "understand",
                "describe", "elaborate", "clarify"
            ],
            "examples": [
                "example", "similar", "practice", "show me", "demonstrate",
                "illustrate", "give an instance"
            ],
            "mistakes": [
                "mistake", "error", "wrong", "incorrect", "avoid",
                "common problem", "pitfall", "caution"
            ]
        }
        
        matches = {
            approach: sum(1 for word in words if word in question_lower)
            for approach, words in keywords.items()
        }
        
        best_approach = max(matches.items(), key=lambda x: x[1])[0]
        return best_approach if matches[best_approach] > 0 else "step_by_step"

    async def solve(self, question: str, approach: Optional[str] = None) -> Dict[str, Any]:
        """Solve math problem with context awareness"""
        try:
            if not question.strip():
                raise ValueError("Question cannot be empty")

            # Get relevant context
            context = await self._get_relevant_context(question)
            
            # Detect approach
            if not approach or approach == "auto":
                approach = self._detect_approach(question)
                approach_source = "auto"
            else:
                approach_source = "specified"

            # Create messages with context
            messages = [
                SystemMessage(content=f"""You are an expert JEE tutor.
                Previous context: {context['conversation_summary'].get('history', '')}
                Approach: {approach}
                Guidelines: {self.tools[approach]}
                """),
                HumanMessage(content=question)
            ]

            # Get response
            response = await self.llm.ainvoke(messages)
            
            # Store interaction
            metadata = {
                "approach": approach,
                "topics": self._extract_topics(question),
                "complexity": self._assess_complexity(question)
            }
            
            await self._store_interaction(
                question=question,
                answer=response.content,
                metadata=metadata
            )

            return {
                "solution": response.content,
                "context_used": context,
                "approach_used": approach,
                "approach_detection": approach_source,
                "session_id": self.session_id
            }

        except Exception as e:
            raise Exception(f"Error in agent execution: {str(e)}")

    async def cleanup(self):
        """Cleanup resources"""
        self.window_memory.clear()
        self.summary_memory.clear()