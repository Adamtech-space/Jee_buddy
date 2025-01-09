from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# router.register(r'conversations', views.ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    # path('chat/', views.chat, name='chat'),
    path('solve-math/', views.solve_math_problem, name='solve-math'),
]