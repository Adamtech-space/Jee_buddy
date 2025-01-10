from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from subscription.models import Subscription
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def get_user_usage_stats(request):
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({
                'status': 'error',
                'message': 'User ID is required'
            }, status=400)

        # Get current subscription
        subscription = Subscription.objects.filter(
            user_id=user_id,
            status='active'
        ).order_by('-created_at').first()

        # Calculate subscription details
        subscription_data = None
        if subscription:
            now = timezone.now()
            days_remaining = (subscription.valid_till - now).days if subscription.valid_till > now else 0
            subscription_data = {
                'plan_name': subscription.get_plan_display(),
                'status': 'active' if days_remaining > 0 else 'expired',
                'days_remaining': days_remaining
            }

        # Get AI usage statistics
        # In a real application, you would track these in a separate model
        ai_usage = {
            'total_interactions': 150,  # Example value
            'remaining_messages': 350,  # Example value
            'usage_percentage': 30  # Example value
        }

        # Get practice statistics
        practice_stats = {
            'total_questions': 75,  # Example value
            'correct_answers': 60,  # Example value
            'accuracy': 80  # Example value
        }

        # Calculate study time
        study_time = {
            'hours': 24,  # Example value
            'sessions': 12,  # Example value
            'average_session': 2  # Example value
        }

        # Get recent activity
        # In a real application, you would track these in a separate model
        recent_activity = [
            {
                'description': 'Completed Physics Practice Test',
                'timestamp': (timezone.now() - timedelta(hours=2)).isoformat()
            },
            {
                'description': 'AI Chat Session - Chemistry Topics',
                'timestamp': (timezone.now() - timedelta(hours=5)).isoformat()
            },
            {
                'description': 'Solved Mathematics Question Bank',
                'timestamp': (timezone.now() - timedelta(days=1)).isoformat()
            }
        ]

        return JsonResponse({
            'status': 'success',
            'data': {
                'subscription': subscription_data,
                'ai_usage': ai_usage,
                'practice': practice_stats,
                'study_time': study_time,
                'recent_activity': recent_activity
            }
        })

    except Exception as e:
        logger.error(f"Error fetching usage stats: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500) 