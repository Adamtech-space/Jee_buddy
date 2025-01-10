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
    # Ensure both datetimes are timezone aware
    if timezone.is_naive(valid_till):
        valid_till = timezone.make_aware(valid_till)
    return (valid_till - now).days

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
            # Ensure valid_till is timezone aware
            valid_till = subscription.valid_till
            if timezone.is_naive(valid_till):
                valid_till = timezone.make_aware(valid_till)
                
            days_remaining = calculate_days_remaining(valid_till)
            is_active = days_remaining > 0

            return JsonResponse({
                'status': 'success',
                'is_subscribed': is_active,
                'subscription_id': subscription.subscription_id,
                'plan_id': subscription.plan_id,
                'created_at': subscription.created_at.isoformat(),
                'valid_till': valid_till.isoformat(),
                'days_remaining': days_remaining,
                'next_billing_date': valid_till.isoformat() if valid_till else None
            })
        else:
            return JsonResponse({
                'status': 'success',
                'is_subscribed': False
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

            # Calculate subscription validity with timezone awareness
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
        email = data.get('email', '')
        name = data.get('name', '')

        if not user_id or not plan_id:
            return JsonResponse({
                'status': 'error',
                'message': 'User ID and Plan ID are required'
            }, status=400)

        try:
            # Create subscription in Razorpay
            subscription_data = {
                "plan_id": plan_id,
                "customer_notify": 1,
                "quantity": 1,
                "total_count": 1,  # One-time payment
                "notes": {
                    "user_id": str(user_id),
                    "email": email,
                    "name": name
                }
            }
            
            subscription = razorpay_client.subscription.create(subscription_data)
            
            # Create local subscription record with timezone-aware datetime
            Subscription.objects.create(
                user_id=user_id,
                subscription_id=subscription['id'],
                plan_id=plan_id,
                status='created',
                amount=subscription.get('total_amount', 0) / 100,
                currency=subscription.get('currency', 'INR'),
                metadata=json.dumps(subscription)
            )

            return JsonResponse({
                'status': 'success',
                'razorpay_key': RAZORPAY_KEY_ID,
                'order': subscription
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
                'name': 'Basic Plan',
                'price': 499,
                'features': [
                    'Basic AI assistance',
                    'Study materials access',
                    'Basic flashcards'
                ]
            },
            'PRO': {
                'id': PLANS['PRO'],
                'name': 'Pro Plan',
                'price': 1499,
                'features': [
                    'Extended AI assistance',
                    'Full study materials',
                    'Question bank access',
                    'Performance analytics',
                    'Priority support'
                ]
            },
            'PREMIUM': {
                'id': PLANS['PREMIUM'],
                'name': 'Premium Plan',
                'price': 4999,
                'features': [
                    'Unlimited AI assistance',
                    'Complete study materials',
                    'Full question bank',
                    'Advanced analytics',
                    'Priority support',
                    'AI content generation',
                    'Download access'
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