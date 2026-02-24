import json
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from users.models import Driver

User = get_user_model()

# ======================================================
# ✅ SAFE USER FETCH
# ======================================================

@database_sync_to_async
def get_user_from_token(token):
    try:
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        return jwt_auth.get_user(validated_token)
    except:
        return None


# ======================================================
# ✅ SAFE DRIVER FETCH
# ======================================================

@database_sync_to_async
def get_driver_by_user(user):
    try:
        return Driver.objects.filter(user=user).first()
    except:
        return None


# ======================================================
# 🚘 RIDE SOCKET
# ======================================================

class RideConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        self.ride_id = self.scope["url_route"]["kwargs"]["ride_id"]

        query_string = parse_qs(self.scope["query_string"].decode())
        token = query_string.get("token")

        if not token:
            await self.close()
            return

        self.user = await get_user_from_token(token[0])

        if not self.user:
            await self.close()
            return

        self.group_name = f"ride_{self.ride_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        print(f"🚘 Ride Connected: {self.user.id}")


    async def disconnect(self, close_code):

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )


    async def receive(self, text_data):

        data = json.loads(text_data)

        if data["type"] == "driver_location":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "broadcast_location",
                    "sender": "driver",
                    "lat": data["lat"],
                    "lon": data["lon"],
                }
            )

        if data["type"] == "user_location":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "broadcast_location",
                    "sender": "user",
                    "lat": data["lat"],
                    "lon": data["lon"],
                }
            )


    async def broadcast_location(self, event):

        await self.send(text_data=json.dumps({
            "type": event["sender"] + "_location",
            "lat": event["lat"],
            "lon": event["lon"],
        }))


    # 🔥🔥🔥 VERY IMPORTANT
    async def send_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))


# ======================================================
# 🚖 DRIVER SOCKET
# ======================================================

class DriverConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        query_string = parse_qs(self.scope["query_string"].decode())
        token = query_string.get("token")

        if not token:
            await self.close()
            return

        user = await get_user_from_token(token[0])

        if not user:
            await self.close()
            return

        driver = await get_driver_by_user(user)

        if not driver:
            await self.close()
            return

        self.driver_id = driver.id
        self.group_name = f"driver_{self.driver_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()


    async def disconnect(self, close_code):

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )


    async def send_notification(self, event):

        await self.send(text_data=json.dumps(event["data"]))