from rest_framework import serializers
from rides.models import Ride
from users.models import User, Driver, OTP, DriverNotification


# ----------------------------
# Ride Serializer (REPLACES BookingSerializer)
# ----------------------------
class RideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ride
        fields = "__all__"
        read_only_fields = (
            "customer",
            "driver",
            "distance_km",
            "fare",
            "status",
            "ride_otp",
            "created_at",
            "started_at",
            "completed_at",
        )

# ----------------------------
# Driver Serializer
# ----------------------------
class DriverSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Driver
        fields = [
            "id",
            "user",
            "user_name",
            "user_phone",
            "user_email",
            "license_number",
            "vehicle_type",
            "vehicle_number",
            "aadhar_number",
            "bank_name",
            "bank_account_number",
            "ifsc_code",
            "profile_image",
            "is_verified",
        ]
        depth = 1


# ----------------------------
# OTP Serializers
# ----------------------------
class RequestOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)


class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=6)

    def validate(self, data):
        phone = data.get("phone")
        code = data.get("code")

        try:
            otp_record = OTP.objects.get(phone=phone, code=code, is_used=False)
        except OTP.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP or phone number")

        from django.utils import timezone
        from datetime import timedelta

        if timezone.now() > otp_record.created_at + timedelta(minutes=10):
            raise serializers.ValidationError("OTP has expired")

        data["otp_record"] = otp_record
        return data


# ----------------------------
# User Serializer
# ----------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "phone", "email", "is_driver"]


# ----------------------------
# Driver Notification Serializer
# ----------------------------
class DriverNotificationSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()

    class Meta:
        model = DriverNotification
        fields = ["id", "title", "message", "type", "is_read", "time"]

    def get_time(self, obj):
        return obj.created_at.strftime("%b %d, %I:%M %p")
