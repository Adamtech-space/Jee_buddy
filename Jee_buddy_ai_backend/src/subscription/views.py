from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import razorpay
from .models import Subscription
from django.contrib.auth.models import User
from django.utils import timezone
import json
import logging
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    logger.error("Razorpay credentials not found in environment variables")
    raise Exception("Razorpay credentials not configured")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

PLANS = {
    'BASIC': 'plan_PhmnKiiVXD3B1M',
    'PREMIUM': 'plan_Phmo9yOZAKb0P8',
    'PRO': 'plan_PhmnlqjWH24hwy'
}

def calculate_days_remaining(valid_till):
    if not valid_till:
        return 0
    now = timezone.now()
    if valid_till < now:
        return 0
    remaining = (valid_till - now).days
    return remaining if remaining >= 0 else 0

@csrf_exempt
def get_subscription_status(request):
    try:
        user_id = request.GET.get('user_id')
        if not user_id:
            return JsonResponse({
                'status': 'error',
                'message': 'User ID is required'
            }, status=400)

        # Check if user has an active subscription
        subscription = Subscription.objects.filter(
            user_id=user_id,
            status='active'
        ).order_by('-created_at').first()

        if subscription:
            days_remaining = calculate_days_remaining(subscription.valid_till)
            is_active = days_remaining > 0
            
            # Calculate subscription period details
            start_date = subscription.created_at
            end_date = subscription.valid_till
            total_days = 28  # Monthly cycle
            used_days = total_days - days_remaining

            # Prepare detailed subscription info
            subscription_info = {
                'status': 'success',
                'is_subscribed': is_active,
                'subscription_id': subscription.subscription_id,
                'plan_id': subscription.plan_id,
                'subscription_details': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'total_days': total_days,
                    'days_used': used_days,
                    'days_remaining': days_remaining,
                    'subscription_progress': f"{used_days}/{total_days} days",
                    'expiry_status': 'active' if days_remaining > 3 else 'expiring_soon' if days_remaining > 0 else 'expired'
                }
            }

            # Add reminder message based on remaining days
            if 0 < days_remaining <= 3:
                subscription_info['reminder_message'] = f"Your subscription expires in {days_remaining} days. Please renew to maintain uninterrupted access."
            elif days_remaining == 0:
                subscription_info['reminder_message'] = "Your subscription has expired. Please renew to continue accessing premium features."
            
            return JsonResponse(subscription_info)
        else:
            return JsonResponse({
                'status': 'success',
                'is_subscribed': False,
                'subscription_details': None
            })

    except Exception as e:
        logger.error(f"Error checking subscription status: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def subscription_callback(request):
    try:
        logger.info("Received payment callback")
        
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST

        subscription_id = data.get('razorpay_subscription_id')
        payment_id = data.get('razorpay_payment_id')
        signature = data.get('razorpay_signature')
        user_id = data.get('user_id')

        if not all([subscription_id, payment_id, signature, user_id]):
            logger.error("Missing required payment verification data")
            return JsonResponse({
                "status": "error",
                "message": "Missing payment verification data"
            }, status=400)

        try:
            payment = razorpay_client.payment.fetch(payment_id)
            subscription_details = razorpay_client.subscription.fetch(subscription_id)

            if payment.get('status') != 'captured':
                logger.error(f"Payment not captured. Status: {payment.get('status')}")
                return JsonResponse({
                    "status": "error",
                    "message": "Payment not captured"
                }, status=400)

            # Calculate subscription validity
            start_date = timezone.now()
            valid_till = start_date + timedelta(days=28)  # 28-day cycle

            try:
                subscription = Subscription.objects.get(subscription_id=subscription_id)
                subscription.payment_id = payment_id
                subscription.status = 'active'
                subscription.payment_status = 'completed'
                subscription.updated_at = start_date
                subscription.valid_till = valid_till
            except Subscription.DoesNotExist:
                subscription = Subscription.objects.create(
                    user_id=user_id,
                    subscription_id=subscription_id,
                    payment_id=payment_id,
                    plan_id=subscription_details.get('plan_id'),
                    status='active',
                    amount=payment.get('amount', 0) / 100,
                    currency=payment.get('currency', 'INR'),
                    created_at=start_date,
                    updated_at=start_date,
                    valid_till=valid_till,
                    payment_status='completed',
                    metadata=json.dumps({
                        'razorpay_details': subscription_details,
                        'payment_details': payment,
                        'signature': signature
                    })
                )
            
            subscription.save()
            logger.info(f"Saved subscription record: {subscription.id}")

            return JsonResponse({
                "status": "success",
                "message": "Subscription is now active",
                "subscription_id": subscription_id,
                "valid_till": valid_till.isoformat(),
                "days_remaining": 28,
                "plan_id": subscription.plan_id
            })

        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": f"Payment verification failed: {str(e)}"
            }, status=400)

    except Exception as e:
        logger.error(f"Error in callback: {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def create_subscription(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        plan_id = data.get('plan_id')

        if not user_id or not plan_id:
            return JsonResponse({
                'status': 'error',
                'message': 'User ID and Plan ID are required'
            }, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'User not found'
            }, status=404)

        try:
            # Create subscription in Razorpay
            subscription_data = {
                "plan_id": plan_id,
                "customer_notify": 1,
                "quantity": 1,
                "total_count": 1,  # Single month subscription
                "notes": {
                    "user_id": str(user_id)
                }
            }
            
            subscription = razorpay_client.subscription.create(subscription_data)
            
            # Create local subscription record
            Subscription.objects.create(
                user=user,
                subscription_id=subscription['id'],
                plan_id=plan_id,
                status='created',
                amount=subscription.get('total_amount', 0) / 100,
                currency=subscription.get('currency', 'INR'),
                created_at=timezone.now(),
                metadata=json.dumps(subscription)
            )

            return JsonResponse({
                'status': 'success',
                'subscription_id': subscription['id'],
                'short_url': subscription.get('short_url'),
                'plan_id': plan_id,
                'message': 'Monthly subscription created successfully'
            })

        except Exception as e:
            logger.error(f"Error creating Razorpay subscription: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Failed to create subscription: {str(e)}'
            }, status=400)

    except Exception as e:
        logger.error(f"Error in create_subscription: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
def get_plans(request):
    try:
        plans_data = {
            'BASIC': {
                'id': PLANS['BASIC'],
                'name': 'Basic Monthly',
                'price': 499,
                'interval': 'monthly',
                'features': [
                    'Basic AI assistance (100 messages/month)',
                    'Study materials access',
                    'Basic flashcards',
                    'Monthly subscription'
                ]
            },
            'PRO': {
                'id': PLANS['PRO'],
                'name': 'Pro Monthly',
                'price': 1499,
                'interval': 'monthly',
                'features': [
                    'Extended AI assistance (500 messages/month)',
                    'Full study materials',
                    'Question bank access',
                    'Performance analytics',
                    'Priority support',
                    'Monthly subscription'
                ]
            },
            'PREMIUM': {
                'id': PLANS['PREMIUM'],
                'name': 'Premium Monthly',
                'price': 4999,
                'interval': 'monthly',
                'features': [
                    'Unlimited AI assistance',
                    'Complete study materials',
                    'Full question bank',
                    'Advanced analytics',
                    'Priority support',
                    'AI content generation',
                    'Download access',
                    'Monthly subscription'
                ]
            }
        }
        
        return JsonResponse({
            'status': 'success',
            'plans': plans_data
        })
    except Exception as e:
        logger.error(f"Error fetching plans: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
        