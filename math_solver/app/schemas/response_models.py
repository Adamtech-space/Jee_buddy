from pydantic import BaseModel

class SolutionResponse(BaseModel):
    success: bool
    solution: str | None = None
    error: str | None = None