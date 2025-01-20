
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('main.urls')),
    path('api/auth/', include('user.urls')),
    path('subscription/', include('subscription.urls')),
    path('', include("user.urls")),
]
