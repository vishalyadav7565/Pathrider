from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Main API routes
    path('api/rides/', include('rides.urls')),   # ✅ separate rides URLs
    path('api/users/', include('users.urls')),   # ✅ separate user (OTP/login) URLs

    # JWT authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
