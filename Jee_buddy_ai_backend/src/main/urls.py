from django.urls import path
from . import views

urlpatterns = [
    path('solve-math/', views.solve_math_problem, name='solve_math_problem'),
    path('test-db/', views.test_db_connection, name='test_db_connection'),
]