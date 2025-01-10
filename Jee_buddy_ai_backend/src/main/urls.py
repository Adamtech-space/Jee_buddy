from django.urls import path
from . import views

urlpatterns = [
    path('solve-math/', views.solve_math_problem, name='solve_math_problem'),
    path('profile/', views.get_current_profile, name='get_current_profile'),
]
