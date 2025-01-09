import os
import sys
import pytest

# Add src directory to Python path
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.insert(0, src_path)

@pytest.fixture(scope="function")
def math_agent():
    from main.agents.math_agent import MathAgent
    return MathAgent()