import math
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


# ================= DISTANCE =================
def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ================= WS NOTIFICATION =================
def send_ride_notification(driver_id, booking):

    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"driver_{driver_id}",
        {
            "type": "send_notification",
            "data": {
                "type": "NEW_RIDE",     # ✅ VERY IMPORTANT
                "data": {
                    "id": booking.id,
                    "pickup_location_text": booking.pickup_location_text,
                    "drop_location_text": booking.drop_location_text,
                    "fare": booking.fare,
                    "distance_km": booking.distance_km,
                    "vehicle_type": booking.vehicle_type,
                    "status": booking.status,
                    "pickup_lat": booking.pickup_lat,
                    "pickup_lon": booking.pickup_lon,
                }
            }
        },
    )