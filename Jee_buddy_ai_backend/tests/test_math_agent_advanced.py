import pytest
import pytest_asyncio
import asyncio
from src.main.agents.math_agent_1 import MathAgent
from concurrent.futures import ThreadPoolExecutor
import json
import re
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(os.path.dirname(current_dir), 'src')
sys.path.insert(0, src_dir)

pytestmark = pytest.mark.asyncio
class TestMathAgentAdvanced:
    @pytest.fixture
    def math_agent(self):
        return MathAgent()

    @pytest.mark.asyncio
    async def test_complex_mathematical_expressions(self, math_agent):
        """Test handling of complex mathematical expressions and symbols"""
        complex_questions = [
            {
                "question": "Solve: ∫(e^x * sin(x))dx",
                "approach": "step_by_step",
                "expected_elements": ["integration by parts", "formula", "steps"]
            },
            {
                "question": "Find the eigenvalues of matrix [[1,2],[3,4]]",
                "approach": "step_by_step",
                "expected_elements": ["characteristic equation", "determinant"]
            },
            {
                "question": "Solve: lim(x→∞) (1 + 1/x)^x",
                "approach": "step_by_step",
                "expected_elements": ["e", "limit"]
            }
        ]

        for test_case in complex_questions:
            result = await math_agent.solve(test_case["question"], test_case["approach"])
            for element in test_case["expected_elements"]:
                assert any(element.lower() in result["solution"].lower() for element in test_case["expected_elements"]), \
                    f"Missing expected element: {element}"

        print("\n✅ Complex Mathematical Expressions Test Passed")

    @pytest.mark.asyncio
    async def test_multi_subject_integration(self, math_agent):
        """Test questions that span multiple JEE subjects"""
        question = """
        A particle moves under a force F = -kx. If its total energy is 100J and potential energy at x = 2m is 64J:
        a) Find its velocity at x = 2m
        b) Find the value of k
        c) Write the differential equation of motion
        """
        result = await math_agent.solve(question, "step_by_step")
        
        # Check for physics and math concepts
        assert any(term in result["solution"].lower() for term in 
                  ["kinetic energy", "potential energy", "conservation", "differential equation"])
        
        print("\n✅ Multi-subject Integration Test Passed")

    @pytest.mark.asyncio
    async def test_conversation_coherence(self, math_agent):
        """Test maintaining context across a complex conversation"""
        conversation = [
            ("What is the derivative of ln(x)?", "basics"),
            ("Now integrate the result", "step_by_step"),
            ("What if we had ln(x²) instead?", "examples"),
            ("Show common mistakes for these types of problems", "mistakes")
        ]
        
        responses = []
        for question, approach in conversation:
            result = await math_agent.solve(question, approach)
            responses.append(result["solution"])
            
        # Check context maintenance
        assert any("previous" in resp.lower() for resp in responses[1:]), \
            "Context from previous questions not maintained"
            
        print("\n✅ Conversation Coherence Test Passed")

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, math_agent):
        """Test handling multiple concurrent requests"""
        async def make_request(question):
            return await math_agent.solve(question, "step_by_step")

        questions = [
            "What is integration?",
            "Explain differentiation",
            "Define limits",
            "Describe vectors",
            "Explain matrices"
        ]
        
        tasks = [make_request(q) for q in questions]
        responses = await asyncio.gather(*tasks)
        
        assert len(responses) == len(questions), "Not all concurrent requests completed"
        assert all("solution" in resp for resp in responses), "Some responses missing solution"
        
        print("\n✅ Concurrent Requests Test Passed")

    @pytest.mark.asyncio
    async def test_response_format_consistency(self, math_agent):
        """Test consistency of response formatting"""
        def check_format(solution):
            required_sections = [
                "Concept Understanding",
                "Step-by-Step Solution",
                "Key Points to Remember",
                "Similar Problem Types"
            ]
            
            # Check section headers
            for section in required_sections:
                assert section in solution, f"Missing section: {section}"
            
            # Check bullet points and numbering
            assert "•" in solution, "Missing bullet points"
            assert re.search(r'\d+\.', solution), "Missing numbered steps"
            
            # Check formatting
            assert "**" in solution, "Missing bold formatting"
            
        questions = [
            ("Solve x² + 2x + 1 = 0", "step_by_step"),
            ("Explain Newton's laws", "basics"),
            ("Describe periodic table", "examples")
        ]
        
        for question, approach in questions:
            result = await math_agent.solve(question, approach)
            check_format(result["solution"])
            
        print("\n✅ Response Format Consistency Test Passed")

    @pytest.mark.asyncio
    async def test_error_recovery(self, math_agent):
        """Test recovery from various error conditions"""
        error_cases = [
            {"question": "?" * 1000, "approach": "basics"},  # Very long question
            {"question": "$$$$", "approach": "step_by_step"},  # Strange characters
            {"question": "", "approach": "examples"},  # Empty question
            {"question": "Valid question", "approach": "invalid_approach"}  # Invalid approach
        ]
        
        for case in error_cases:
            try:
                await math_agent.solve(case["question"], case["approach"])
            except Exception as e:
                assert str(e), "Error should have descriptive message"
                continue
                
        print("\n✅ Error Recovery Test Passed")

    @pytest.mark.asyncio
    async def test_memory_management(self, math_agent):
        """Test memory usage with large conversation history"""
        import sys
        import objsize
        
        initial_size = objsize.get_deep_size(math_agent)
        
        # Generate large conversation
        for i in range(20):
            await math_agent.solve(f"Test question {i}", "step_by_step")
            
        final_size = objsize.get_deep_size(math_agent)
        
        # Check if memory growth is bounded
        assert final_size < initial_size * 3, "Memory usage grew too large"
        assert len(math_agent.chat_history) <= 10, "Chat history not properly truncated"
        
        print("\n✅ Memory Management Test Passed")

    @pytest.mark.asyncio
    async def test_response_quality_metrics(self, math_agent):
        """Test quality metrics of responses"""
        question = "Explain the concept of integration"
        result = await math_agent.solve(question, "basics")
        solution = result["solution"]
        
        # Define quality metrics
        metrics = {
            "min_length": 200,  # Minimum response length
            "max_length": 2000,  # Maximum response length
            "required_keywords": ["integral", "antiderivative", "function"],
            "section_count": 4,  # Number of main sections
            "formula_presence": True,  # Should contain mathematical formulae
        }
        
        # Check metrics
        assert len(solution) >= metrics["min_length"], "Response too short"
        assert len(solution) <= metrics["max_length"], "Response too long"
        assert all(keyword in solution.lower() for keyword in metrics["required_keywords"]), \
            "Missing required keywords"
        assert solution.count("**") >= metrics["section_count"] * 2, \
            "Missing required sections"
        
        print("\n✅ Response Quality Metrics Test Passed")

def run_all_tests():
    """Run all advanced tests"""
    pytest.main(["-v", "test_math_agent_advanced.py"])

if __name__ == "__main__":
    run_all_tests()