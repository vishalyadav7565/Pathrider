from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rides.models import Ride

from .serializers import RideSerializer, DriverSerializer, DriverNotificationSerializer
from .models import User, Driver, OTP, DriverNotification
from django.contrib.auth.hashers import make_password
import random
from django.utils import timezone


# ---------------------------------------------------
# 🚗 RIDE VIEWSET
# ---------------------------------------------------
class RideViewSet(viewsets.ModelViewSet):
    serializer_class = RideSerializer
    permission_classes = [IsAuthenticated]

    # ✅ Return only rides relevant to the logged-in user
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "driver_profile"):
            return Ride.objects.filter(driver=user.driver_profile).order_by("-created_at")
        return Ride.objects.filter(customer=user).order_by("-created_at")

    # ✅ Custom endpoint: GET /api/rides/my_rides/
    @action(detail=False, methods=["get"])
    def my_rides(self, request):
        user = request.user
        if hasattr(user, "driver_profile"):
            rides = Ride.objects.filter(driver=user.driver_profile).order_by("-created_at")
        else:
            rides = Ride.objects.filter(customer=user).order_by("-created_at")
        return Response(RideSerializer(rides, many=True).data)

    # ✅ Driver: Accept ride
    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        user = request.user
        if not hasattr(user, "driver_profile"):
            return Response({"error": "You are not a driver"}, status=403)
        ride = self.get_object()
        if ride.status != "pending":
            return Response({"error": "Ride not available"}, status=400)
        ride.driver = user.driver_profile
        ride.status = "accepted"
        ride.save()
        return Response(RideSerializer(ride).data)

    # ✅ Driver: Complete ride
    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        user = request.user
        if not hasattr(user, "driver_profile"):
            return Response({"error": "You are not a driver"}, status=403)
        ride = self.get_object()
        if ride.driver != user.driver_profile:
            return Response({"error": "Not your ride"}, status=403)
        ride.status = "completed"
        ride.save()
        return Response(RideSerializer(ride).data)

    # ✅ Driver: Cancel ride
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        user = request.user
        if not hasattr(user, "driver_profile"):
            return Response({"error": "You are not a driver"}, status=403)
        ride = self.get_object()
        if ride.driver != user.driver_profile:
            return Response({"error": "Not your ride"}, status=403)
        ride.status = "cancelled"
        ride.save()
        return Response(RideSerializer(ride).data)

    # ✅ Customer: Cancel own ride
    @action(detail=True, methods=["post"])
    def customer_cancel(self, request, pk=None):
        user = request.user
        ride = self.get_object()
        if ride.customer != user:
            return Response({"error": "Not your ride"}, status=403)
        ride.status = "cancelled"
        ride.save()
        return Response(RideSerializer(ride).data)


# ---------------------------------------------------
# 👨‍✈️ DRIVER LOGIN (Password)
# ---------------------------------------------------
class DriverLoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        phone = request.data.get("phone")
        password = request.data.get("password")

        if not phone or not password:
            return Response({"error": "Phone and password required"}, status=400)

        user = authenticate(request, username=phone, password=password)
        if user is None:
            return Response({"error": "Invalid credentials"}, status=401)
        if not user.is_driver:
            return Response({"error": "Only drivers can login here"}, status=403)

        serializer = TokenObtainPairSerializer(data={"username": phone, "password": password})
        serializer.is_valid(raise_exception=True)

        return Response({
            "refresh": serializer.validated_data["refresh"],
            "access": serializer.validated_data["access"],
            "driver": {"id": user.id, "name": user.name, "phone": user.phone}
        }, status=200)


# ---------------------------------------------------
# 🔢 OTP REGISTRATION (DRIVER)
# ---------------------------------------------------
class RequestOTPRegisterView(APIView):
    def post(self, request):
        phone = request.data.get("phone")
        if not phone:
            return Response({"error": "Phone number required"}, status=400)
        if User.objects.filter(phone=phone).exists():
            return Response({"error": "User already registered"}, status=400)

        OTP.objects.filter(phone=phone).delete()
        otp = OTP.objects.create(phone=phone, code=str(random.randint(100000, 999999)))
        print(f"🔢 OTP for {phone}: {otp.code}")
        return Response({"message": "OTP sent successfully (check console)"}, status=200)


class VerifyOTPRegisterView(APIView):
    def post(self, request):
        phone = request.data.get("phone")
        code = request.data.get("otp")
        name = request.data.get("name")
        password = request.data.get("password")
        is_driver = request.data.get("is_driver", False)

        if not phone or not code or not name or not password:
            return Response({"error": "Phone, OTP, name, and password required"}, status=400)

        if User.objects.filter(username=phone).exists():
            return Response({"error": "User already exists"}, status=400)

        try:
            otp = OTP.objects.filter(phone=phone, code=code, is_used=False).latest("created_at")
        except OTP.DoesNotExist:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        otp.is_used = True
        otp.save()

        user = User.objects.create(
            name=name,
            phone=phone,
            username=phone,
            password=make_password(password),
            is_driver=is_driver
        )

        if is_driver:
            Driver.objects.create(user=user)

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Registration successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": user.id, "name": user.name, "phone": user.phone, "is_driver": user.is_driver}
        }, status=200)


# ---------------------------------------------------
# 🧾 DRIVER REGISTRATION (Manual)
# ---------------------------------------------------
class DriverRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        required_fields = ["name", "phone", "email", "password", "confirm_password", "vehicle_number", "license_number", "vehicle_type"]
        if not all(request.data.get(f) for f in required_fields):
            return Response({"error": "All fields are required"}, status=400)

        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")
        phone = request.data.get("phone")
        if password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=400)
        if User.objects.filter(phone=phone).exists():
            return Response({"error": "Driver already exists"}, status=400)

        user = User.objects.create(
            username=phone,
            phone=phone,
            name=request.data.get("name"),
            password=make_password(password),
            is_driver=True
        )

        driver = Driver.objects.create(
            user=user,
            license_number=request.data.get("license_number"),
            vehicle_type=request.data.get("vehicle_type"),
            is_verified=False
        )

        return Response({
            "message": "Driver registered successfully",
            "driver": {
                "id": user.id,
                "name": user.name,
                "phone": user.phone,
                "license_number": driver.license_number,
                "vehicle_type": driver.vehicle_type
            }
        }, status=201)


# ---------------------------------------------------
# 📲 DRIVER LOGIN WITH OTP
# ---------------------------------------------------
class DriverLoginOTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone")
        if not phone:
            return Response({"error": "Phone number required"}, status=400)

        try:
            user = User.objects.get(phone=phone, is_driver=True)
        except User.DoesNotExist:
            return Response({"error": "Driver not found"}, status=404)

        OTP.objects.filter(phone=phone).delete()
        otp = OTP.objects.create(phone=phone, code=str(random.randint(100000, 999999)))
        print(f"🔢 OTP for driver login {phone}: {otp.code}")
        return Response({"message": "OTP sent successfully"}, status=200)


class DriverLoginOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = str(request.data.get("phone", "")).strip()
        code = str(request.data.get("otp", "")).strip()

        if not phone or not code:
            return Response({"error": "Phone and OTP required"}, status=400)

        otp = OTP.objects.filter(phone=phone, code=code, is_used=False).order_by('-created_at').first()
        if not otp:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        otp.is_used = True
        otp.save()

        user = User.objects.filter(phone=phone, is_driver=True).first()
        if not user:
            return Response({"error": "Driver not found"}, status=404)

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "driver": {"id": user.id, "name": user.name, "phone": user.phone}
        }, status=200)


# ---------------------------------------------------
# 👤 DRIVER PROFILE
# ---------------------------------------------------
class DriverProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_driver:
            return Response({"error": "User is not a driver"}, status=403)

        try:
            driver = Driver.objects.get(user=user)
        except Driver.DoesNotExist:
            return Response({"error": "Driver profile not found"}, status=404)

        serializer = DriverSerializer(driver)
        return Response({
            "driver": serializer.data,
            "user": {"id": user.id, "name": user.name, "phone": user.phone, "email": getattr(user, "email", None)},
        }, status=200)


# ---------------------------------------------------
# 👤 USER OTP REGISTRATION + LOGIN
# ---------------------------------------------------
class UserRegisterOTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone")
        if not phone:
            return Response({"error": "Phone number required"}, status=400)

        if User.objects.filter(phone=phone, is_driver=False).exists():
            return Response({"error": "User already registered"}, status=400)

        OTP.objects.filter(phone=phone).delete()
        code = str(random.randint(100000, 999999))
        OTP.objects.create(phone=phone, code=code)
        print(f"📩 OTP for user registration {phone}: {code}")

        return Response({"message": "OTP sent successfully"}, status=200)


class UserRegisterOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone")
        code = request.data.get("otp")
        name = request.data.get("name")
        password = request.data.get("password")

        if not phone or not code or not name or not password:
            return Response({"error": "All fields required"}, status=400)

        try:
            otp = OTP.objects.filter(phone=phone, code=code, is_used=False).latest("created_at")
        except OTP.DoesNotExist:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        otp.is_used = True
        otp.save()

        user = User.objects.create(
            username=phone,
            phone=phone,
            name=name,
            password=make_password(password),
            is_driver=False
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "User registration successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": user.id, "name": user.name, "phone": user.phone}
        }, status=200)


class UserLoginOTPRequestView(APIView):
    permission_classes = [AllowAny]  # ✅ Add this line

    def post(self, request):
        phone = request.data.get("phone")
        if not phone:
            return Response({"error": "Phone number required"}, status=400)

        try:
            user = User.objects.get(phone=phone, is_driver=False)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        OTP.objects.filter(phone=phone).delete()
        otp = OTP.objects.create(phone=phone, code=str(random.randint(100000, 999999)))
        print(f"🔢 OTP for User Login {phone}: {otp.code}")
        return Response({"message": "OTP sent successfully"}, status=200)


class UserLoginOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = str(request.data.get("phone", "")).strip()
        code = str(request.data.get("otp", "")).strip()

        if not phone or not code:
            return Response({"error": "Phone and OTP required"}, status=400)

        otp = OTP.objects.filter(phone=phone, code=code, is_used=False).order_by('-created_at').first()
        if not otp:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        otp.is_used = True
        otp.save()

        user = User.objects.filter(phone=phone, is_driver=False).first()
        if not user:
            return Response({"error": "User not found"}, status=404)

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Login successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": user.id, "name": user.name, "phone": user.phone}
        }, status=200)


# ---------------------------------------------------
# 🏦 DRIVER BANK UPDATE
# ---------------------------------------------------
class DriverBankUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        if not user.is_driver:
            return Response({"error": "Not a driver"}, status=403)

        try:
            driver = Driver.objects.get(user=user)
        except Driver.DoesNotExist:
            return Response({"error": "Driver profile not found"}, status=404)

        bank_name = request.data.get("bank_name")
        bank_account_number = request.data.get("bank_account_number")
        ifsc_code = request.data.get("ifsc_code")

        if not bank_name or not bank_account_number or not ifsc_code:
            return Response({"error": "All bank fields are required"}, status=400)

        driver.bank_name = bank_name
        driver.bank_account_number = bank_account_number
        driver.ifsc_code = ifsc_code
        driver.save()

        return Response({
            "message": "Bank details updated successfully",
            "driver": DriverSerializer(driver).data
        }, status=200)


# ---------------------------------------------------
# 🔔 DRIVER NOTIFICATIONS
# ---------------------------------------------------
class DriverNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_driver:
            return Response({"error": "Not authorized"}, status=403)
        driver = Driver.objects.get(user=user)
        notifications = DriverNotification.objects.filter(driver=driver)
        serializer = DriverNotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = DriverNotification.objects.get(pk=pk, driver__user=request.user)
            notif.is_read = True
            notif.save()
            return Response({"status": "marked as read"})
        except DriverNotification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=404)


# ---------------------------------------------------
# 📍 DRIVER WORKING RADIUS UPDATE
# ---------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_working_radius(request):
    try:
        driver = Driver.objects.get(user=request.user)
        radius = int(request.data.get('radius'))
        if radius < 1 or radius > 100:
            return Response({'error': 'Radius must be between 1 and 100 km'}, status=400)
        driver.working_radius_km = radius
        driver.save()
        return Response({'message': f'Radius updated to {radius} km'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)
