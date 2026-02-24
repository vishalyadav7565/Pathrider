import os
import numpy as np
from threading import Timer
from math import radians, sin, cos, sqrt, atan2
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.conf import settings
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Ride
from .serializers import RideSerializer
from users.models import Driver
from rides.invoice import generate_invoice
from rides.utils import send_ride_notification


# ======================================================
# DISTANCE CALCULATION
# ======================================================

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


PRICE_PER_KM = {
    "sedan": 12,
    "suv": 16,
    "luxury": 25,
    "bus": 30,
    "traveller": 20,
}
# ======================================================
# DRIVER MATCHING
# ======================================================
def find_best_driver(pickup_lat, pickup_lon, radius_km=3):

    drivers = Driver.objects.filter(
        is_active=True,
        is_verified=True,
        is_online=True,
        latitude__isnull=False,
        longitude__isnull=False
    ).values_list('id','latitude','longitude','rating')

    if not drivers:
        return None

    dt = np.dtype([
        ('id',np.int32),
        ('lat',np.float32),
        ('lon',np.float32),
        ('rating',np.float32)
    ])

    driver_array = np.array(list(drivers), dtype=dt)

    distance = np.sqrt(
        (driver_array['lat'] - float(pickup_lat))**2 +
        (driver_array['lon'] - float(pickup_lon))**2
    ) * 111

    nearby = driver_array[distance < radius_km]

    if len(nearby) == 0:
        return None

    score = distance[distance < radius_km]*0.7 - nearby['rating']*2

    best_index = np.argmin(score)

    best_driver_id = int(nearby[best_index]['id'])

    return Driver.objects.get(id=best_driver_id)
# ======================================================

def auto_cancel_ride(ride_id):

    ride = Ride.objects.filter(
        id=ride_id,
        status="pending"
    ).first()

    if ride:
        ride.status = "cancelled"
        ride.save()

        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            f"ride_{ride.id}",
            {
                "type": "send_message",
                "data": {
                    "type": "ride_cancelled",
                    "message": "No drivers available nearby"
                }
            }
        )

# ======================================================
# CREATE RIDE
# ======================================================

def create_ride(request, booking_type):
    d = request.data

    distance = haversine_km(
        float(d["pickup_lat"]),
        float(d["pickup_lon"]),
        float(d["drop_lat"]),
        float(d["drop_lon"]),
    )

    vehicle = d.get("vehicle_type", "sedan")
    fare = round(distance * PRICE_PER_KM.get(vehicle, 12), 2)

    ride = Ride.objects.create(
        customer=request.user,
        booking_type=booking_type,
        pickup_location_text=d["pickup_location_text"],
        drop_location_text=d["drop_location_text"],
        pickup_lat=d["pickup_lat"],
        pickup_lon=d["pickup_lon"],
        drop_lat=d["drop_lat"],
        drop_lon=d["drop_lon"],
        vehicle_type=vehicle,
        quantity=d.get("quantity", 1),
        distance_km=round(distance, 2),
        fare=fare,
        status="pending",
    )


    # AUTO ASSIGN
    best_driver = find_best_driver(d["pickup_lat"], d["pickup_lon"], 3)

    if not best_driver:
        best_driver = find_best_driver(d["pickup_lat"], d["pickup_lon"], 5)

    if not best_driver:
        best_driver = find_best_driver(d["pickup_lat"], d["pickup_lon"], 8)

    if best_driver:

        ride.driver = best_driver
        ride.status = "accepted"
        ride.save()

        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            f"ride_{ride.id}",
            {
                "type": "send_message",
                "data": {
                    "type": "ride_accepted",
                    "driver": {
                        "id": best_driver.id,
                        "name": best_driver.user.name,
                        "phone": best_driver.user.phone,
                        "vehicle": best_driver.vehicle_number,
                        "latitude": float(best_driver.latitude or 0),
                        "longitude": float(best_driver.longitude or 0),
                    },
                    "otp": ride.ride_otp,
                }
            }
        )

    else:

        drivers = Driver.objects.filter(is_online=True)

        for driver in drivers:
            send_ride_notification(driver.id, ride)

        Timer(120, auto_cancel_ride, args=[ride.id]).start()

    return Response(RideSerializer(ride).data, status=status.HTTP_201_CREATED)


# ======================================================
# RIDE TYPES
# ======================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def instant_booking(request):
    print("🔥 INSTANT BOOKING HIT 🔥")
    return create_ride(request, "normal")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def luxury_booking(request):
    return create_ride(request, "luxury")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def subscription_booking(request):
    return create_ride(request, "subscription")



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def occasion_booking(request):
    return create_ride(request, "occasion")



# ======================================================
# USER / DRIVER RIDES (VIEWSET)
# ======================================================

from rest_framework.viewsets import ReadOnlyModelViewSet

class RideViewSet(ReadOnlyModelViewSet):
    serializer_class = RideSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # If user is a driver
        if Driver.objects.filter(user=user).exists():
            driver = Driver.objects.get(user=user)
            return Ride.objects.filter(driver=driver).order_by("-created_at")

        # Normal customer
        return Ride.objects.filter(customer=user).order_by("-created_at")
# ======================================================
# DRIVER LOCATION UPDATE
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_driver_location(request):

    if not hasattr(request.user, "driver_profile"):
        return Response({"error": "Not a driver"}, status=403)

    driver = request.user.driver_profile

    driver.latitude = request.data.get("latitude")
    driver.longitude = request.data.get("longitude")
    driver.save()

    # 🔥 Find active ride manually
    active_ride = Ride.objects.filter(
        driver=driver,
        status__in=["accepted", "ongoing"]
    ).first()

    if active_ride:
        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            f"ride_{active_ride.id}",
            {
                "type": "driver_location",  # must match consumer
                "lat": float(driver.latitude),
                "lon": float(driver.longitude),
            }
        )

    return Response({"status": "location updated"})

# ======================================================
# DRIVER ACTIONS
# ======================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_nearby_requests(request):
    rides = Ride.objects.filter(status="pending", driver__isnull=True)
    return Response(RideSerializer(rides, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def driver_accept_reject(request):

    if not hasattr(request.user, "driver_profile"):
        return Response({"error": "Not a driver"}, status=403)

    driver = request.user.driver_profile

    ride = Ride.objects.filter(
        id=request.data.get("booking_id"),
        status="pending",
        driver__isnull=True
    ).first()

    if not ride:
        return Response({"error": "Ride not available"}, status=400)

    # Assign driver
    ride.driver = driver
    ride.status = "accepted"
    ride.save()

    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"ride_{ride.id}",
        {
            "type": "send_message",
            "data": {
                "type": "ride_accepted",
                "driver": {
                    "id": driver.id,
                    "name": driver.user.name,  # ✅ FIXED
                    "phone": driver.user.phone,  # ✅ Correct
                    "vehicle": driver.vehicle_number,  # ✅ FIXED
                    "latitude": float(driver.latitude or 0),
                    "longitude": float(driver.longitude or 0),
                },
                "otp": ride.ride_otp,
            }
        }
    )

    return Response({"status": "accepted"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_my_rides(request):
    if not hasattr(request.user, "driver_profile"):
        return Response({"error": "Not a driver"}, status=403)

    rides = Ride.objects.filter(driver=request.user.driver_profile)
    return Response(RideSerializer(rides, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_booking_detail(request, booking_id):
    if not hasattr(request.user, "driver_profile"):
        return Response({"error": "Not a driver"}, status=403)

    ride = get_object_or_404(Ride, id=booking_id, driver=request.user.driver_profile)
    return Response(RideSerializer(ride).data)


# ======================================================
# RIDE FLOW
# ======================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_ride(request, booking_id):
    if not hasattr(request.user, "driver_profile"):
        return Response({"error": "Not a driver"}, status=403)

    ride = get_object_or_404(
        Ride,
        id=booking_id,
        driver=request.user.driver_profile,
        status="accepted"
    )

    if ride.ride_otp != str(request.data.get("otp")):
        return Response({"error": "Invalid OTP"}, status=400)

    ride.status = "ongoing"
    ride.started_at = timezone.now()
    ride.save()

    return Response({"status": "ride started"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def end_ride(request, booking_id):
    if not hasattr(request.user, "driver_profile"):
        return Response({"error": "Not a driver"}, status=403)

    ride = get_object_or_404(
        Ride,
        id=booking_id,
        driver=request.user.driver_profile,
        status="ongoing"
    )

    ride.status = "completed"
    ride.completed_at = timezone.now()
    ride.save()

    return Response({"fare": ride.fare})


# ======================================================
# INVOICE
# ======================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def booking_invoice(request, booking_id):
    ride = get_object_or_404(Ride, id=booking_id, customer=request.user)

    path = os.path.join(settings.BASE_DIR, "invoice.pdf")
    generate_invoice(path, ride)

    return FileResponse(open(path, "rb"), as_attachment=True)
