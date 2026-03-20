from django.urls import re_path
from .consumers import RideConsumer, DriverConsumer

websocket_urlpatterns = [
    re_path(r'ws/ride/(?P<ride_id>\d+)/$', RideConsumer.as_asgi()),
    re_path(r'ws/driver/$', DriverConsumer.as_asgi()),  # ✅ THIS MUST EXIST
]