import os
import django

from django.core.asgi import get_asgi_application

# ✅ STEP 1: SETTINGS FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# ✅ STEP 2: DJANGO SETUP
django.setup()

# ✅ STEP 3: NOW SAFE TO IMPORT
from channels.routing import ProtocolTypeRouter, URLRouter
from core.jwt_middleware import JWTAuthMiddlewareStack
import rides.routing


application = ProtocolTypeRouter({

    "http": get_asgi_application(),

    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            rides.routing.websocket_urlpatterns
        )
    ),

})