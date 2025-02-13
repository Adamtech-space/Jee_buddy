from django.urls import path
from .views import get_subscription_status, create_subscription, subscription_callback

urlpatterns = [
    path('status/', get_subscription_status, name='get_subscription_status'),
    path('create/', create_subscription, name='create_subscription'),
    path('callback/', subscription_callback, name='subscription_callback'),
]