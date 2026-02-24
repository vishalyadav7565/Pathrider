from django.urls import path
from .views import (
    instant_booking,
    luxury_booking,
    subscription_booking,
    occasion_booking,
    RideViewSet,

    update_driver_location,
    driver_nearby_requests,
    driver_accept_reject,
    driver_my_rides,
    driver_booking_detail,

    start_ride,
    end_ride,
    booking_invoice,
)

urlpatterns = [
    # ================= BOOKINGS (POST) =================
    path("bookings/instant/", instant_booking),
    path("bookings/luxury/", luxury_booking),
    path("bookings/subscription/", subscription_booking),
    path("bookings/occasion/", occasion_booking),

    # ================= BOOKINGS (GET) ==================
    path("bookings/", RideViewSet.as_view({"get": "list"})),
    path("bookings/<int:pk>/", RideViewSet.as_view({"get": "retrieve"})),

    # ================= DRIVER ==========================
    path("driver/update-location/", update_driver_location),
    path("driver/nearby-requests/", driver_nearby_requests),
    path("driver/decision/", driver_accept_reject),
    path("driver/my-rides/", driver_my_rides),
    path("driver/booking/<int:booking_id>/", driver_booking_detail),

    # ================= RIDE FLOW =======================
    path("start/<int:booking_id>/", start_ride),
    path("end/<int:booking_id>/", end_ride),

    # ================= INVOICE =========================
    path("invoice/<int:booking_id>/", booking_invoice),
]
#python -m daphne -b 0.0.0.0 -p 8000 core.asgi:application
