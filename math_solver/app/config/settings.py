from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Math Problem Solver"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:8000",  # Local development
    ]
    
    # OpenAI Configuration
    OPENAI_API_KEY: str

    class Config:
        env_file = ".env"