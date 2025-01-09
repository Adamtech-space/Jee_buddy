from rest_framework import serializers
from .models import MathProblem, Solution


class MathProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MathProblem
        fields = ['id', 'question', 'category', 'difficulty', 'created_at']

class SolutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solution
        fields = ['id', 'problem', 'approach_type', 'content', 'created_at']