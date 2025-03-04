from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('post/<slug:slug>/', views.blog_post, name='blog_post'),
    path('generate-blog/', views.generate_blog, name='generate_blog'),
    path('view-blogs/', views.view_blogs, name='view_blogs'),
    path('api/latest-blogs/', views.latest_blogs, name='latest_blogs'),
]

