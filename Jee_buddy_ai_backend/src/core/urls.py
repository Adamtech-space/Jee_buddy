from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('main.urls')),
    # path('api/auth/', include('user.urls')),
    path('', include('user.urls')),
    path('api/subscription/', include('subscription.urls')),
    path('blog/', include('blog.urls')),
]
