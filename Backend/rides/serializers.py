from rest_framework import serializers
from .models import Ride, LuxuryProfile, SubscriptionPlan, OccasionService


class LuxuryProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LuxuryProfile
        fields = "__all__"


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = "__all__"


class OccasionServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = OccasionService
        fields = "__all__"


class RideSerializer(serializers.ModelSerializer):

    customer = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    driver = serializers.SerializerMethodField()

    class Meta:
        model = Ride
        fields = "__all__"
        read_only_fields = (
            "ride_otp",
            "status",
            "created_at",
            "started_at",
            "completed_at",
        )

    def get_driver(self, obj):
        driver = obj.driver

        if not driver:
            return None

        user = getattr(driver, "user", None)

        return {
            "id": driver.id,
            "name": user.get_full_name() if user else "",
            "phone": getattr(user, "phone", "") if user else "",
            "vehicle_number": getattr(driver, "vehicle_number", ""),
            "vehicle_type": getattr(driver, "vehicle_type", ""),
            "latitude": driver.latitude,
            "longitude": driver.longitude,
        }