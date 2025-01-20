from django.urls import path
from . import views
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path('api/solve-math/', csrf_exempt(views.solve_math_problem), name='solve_math'),
    path('api/profile/', views.get_current_profile, name='get_current_profile'),
]
