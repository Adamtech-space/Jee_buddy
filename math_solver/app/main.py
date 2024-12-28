from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .services.math_solver import MathSolver
from .config.settings import Settings
from .schemas.response_models import SolutionResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Math Problem Solver API",
    description="API for solving mathematical problems from images",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "https://your-frontend-domain.com",  # Add your frontend domain
]
# Load settings
settings = Settings()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize math solver
math_solver = MathSolver(api_key=settings.OPENAI_API_KEY)

@app.post("/solve", response_model=SolutionResponse)
async def solve_math_problem(file: UploadFile = File(...)):
    """
    Endpoint to solve math problems from uploaded images
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed"
            )
        
        # Get solution
        solution = await math_solver.solve(file)
        return SolutionResponse(
            success=True,
            solution=solution
        )

    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )