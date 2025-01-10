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
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

razorpay_client = razorpay.Client(auth=("rzp_test_XjxJeSspeBN1S6", "jMfiPB94jnPtWJDYAvFz4tr9"))

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
            return JsonResponse({
                'status': 'success',
                'is_subscribed': True,
                'subscription_id': subscription.subscription_id,
                'created_at': subscription.created_at
            })
        else:
            return JsonResponse({
                'status': 'success',
                'is_subscribed': False
            })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_subscription(request):
    try:
        logger.info("Received subscription creation request")
        logger.debug(f"POST data: {request.POST}")
        logger.debug(f"Headers: {request.headers}")
        
        # Handle both form data and JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            amount = int(data.get('price', 0))
            product_name = data.get('product_name', '')
            plan_id = data.get('plan_id', '')
            user_id = data.get('user_id', '')
        else:
            amount = int(request.POST.get('price', 0))
            product_name = request.POST.get('product_name', '')
            plan_id = request.POST.get('plan_id', '')
            user_id = request.POST.get('user_id', '')

        logger.info(f"Creating subscription for user {user_id} with plan {plan_id}")
        logger.info(f"Amount: {amount}, Product: {product_name}")

        if not all([amount, product_name, plan_id, user_id]):
            return JsonResponse({
                "status": "error",
                "message": "Missing required fields"
            }, status=400)

        try:
            razorpay_subscription_res = razorpay_client.subscription.create({
                'plan_id': plan_id,
                'total_count': 30,
                'addons': [{
                    'item': {
                        'name': product_name,
                        'currency': 'INR',
                        "amount": int(amount) * 100,
                    }
                }],
                'notes': {
                    'user_id': user_id
                }
            })
            logger.info(f"Razorpay response: {razorpay_subscription_res}")
        except Exception as e:
            logger.error(f"Razorpay API error: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": "Failed to create Razorpay subscription"
            }, status=500)

        response_data = {
            "callback_url": "http://127.0.0.1:8000/api/subscription/callback/",
            "razorpay_key": "rzp_test_XjxJeSspeBN1S6",
            "order": razorpay_subscription_res,
            "product_name": product_name
        }

        response = JsonResponse(response_data)
        response["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Accept"
        response["Access-Control-Allow-Credentials"] = "true"
        return response

    except Exception as e:
        logger.error(f"Error creating subscription: {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def subscription_callback(request):
    try:
        logger.info("Received payment callback")
        
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            logger.debug(f"JSON data: {data}")
        else:
            data = request.POST
            logger.debug(f"POST data: {data}")

        if "razorpay_signature" in data:
            payment_verification = razorpay_client.utility.verify_payment_signature(data)
            logger.info(f"Payment verification result: {payment_verification}")

            if payment_verification:
                try:
                    user_id = data.get('user_id')
                    logger.info(f"Creating subscription for user {user_id}")

                    subscription = Subscription.objects.create(
                        user_id=user_id,
                        subscription_id=data.get('razorpay_subscription_id'),
                        status='active',
                        created_at=timezone.now(),
                        updated_at=timezone.now()
                    )
                    
                    return JsonResponse({
                        "status": "success",
                        "message": "Subscription is now active",
                        "subscription_id": subscription.subscription_id
                    })
                except Exception as e:
                    logger.error(f"Error creating subscription record: {str(e)}")
                    return JsonResponse({
                        "status": "error",
                        "message": str(e)
                    }, status=500)
            else:
                return JsonResponse({
                    "status": "error",
                    "message": "Payment verification failed"
                }, status=400)

        return JsonResponse({
            "status": "error",
            "message": "Invalid request"
        }, status=400)
    except Exception as e:
        logger.error(f"Error in callback: {str(e)}")
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)