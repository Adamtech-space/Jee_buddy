from django.urls import path
from . import views
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path('solve-math/', views.solve_math_problem, name='solve_math'),
    path('profile/', views.get_current_profile, name='get_current_profile'),
    path('chat/history/', views.get_chat_history_by_user, name='get_chat_history'),
]
