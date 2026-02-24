from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MarkNotificationReadView,
    RideViewSet,
    DriverLoginView,
    RequestOTPRegisterView,
    VerifyOTPRegisterView,
    DriverRegistrationView,
    DriverLoginOTPRequestView,
    DriverLoginOTPVerifyView,
    DriverProfileView,
    UserRegisterOTPRequestView,
    UserRegisterOTPVerifyView,
    UserLoginOTPRequestView,
    UserLoginOTPVerifyView,
    DriverBankUpdateView,
    DriverNotificationView,
    update_working_radius,
)

# Router for RideViewSet
router = DefaultRouter()
router.register(r"rides", RideViewSet, basename="rides")

urlpatterns = [
    path("", include(router.urls)),

    # Driver login/register
    path("driver/login/", DriverLoginView.as_view(), name="driver_login"),
    path("driver/register/request-otp/", RequestOTPRegisterView.as_view(), name="driver_register_otp_request"),
    path("driver/register/verify-otp/", VerifyOTPRegisterView.as_view(), name="driver_register_otp_verify"),
    path("driver/manual-register/", DriverRegistrationView.as_view(), name="driver_manual_register"),
    path("driver/login/request-otp/", DriverLoginOTPRequestView.as_view(), name="driver_login_otp_request"),
    path("driver/login/verify-otp/", DriverLoginOTPVerifyView.as_view(), name="driver_login_otp_verify"),
    path("driver/profile/", DriverProfileView.as_view(), name="driver_profile"),
     path("driver/bank-update/", DriverBankUpdateView.as_view(), name="driver-bank-update"),
    # User login/register
    path("user/register/request-otp/", UserRegisterOTPRequestView.as_view(), name="user_register_otp_request"),
    path("user/register/verify-otp/", UserRegisterOTPVerifyView.as_view(), name="user_register_otp_verify"),
    path("user/login/request-otp/", UserLoginOTPRequestView.as_view(), name="user_login_otp_request"),
    path("user/login/verify-otp/", UserLoginOTPVerifyView.as_view(), name="user_login_otp_verify"),
    #Ride endpoints are handled by the router
    path("driver/notifications/", DriverNotificationView.as_view(), name="driver_notifications"),
    path("driver/notifications/<int:pk>/read/", MarkNotificationReadView.as_view(), name="mark_notification_read"),
    path('update-radius/', update_working_radius, name='update_radius'),
]
