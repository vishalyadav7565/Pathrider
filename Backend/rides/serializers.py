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
        
