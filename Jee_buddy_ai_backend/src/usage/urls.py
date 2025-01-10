from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.get_user_usage_stats, name='get_user_usage_stats'),
] 