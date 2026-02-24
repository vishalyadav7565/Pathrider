import random
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from users.models import Driver


# ======================================================
# CONSTANTS
# ======================================================

VEHICLE_CHOICES = [
    ("sedan", "Sedan"),
    ("suv", "SUV"),
    ("luxury", "Luxury"),
    ("bus", "Bus"),
    ("traveller", "Traveller"),
]

BOOKING_STATUS = [
    ("pending", "Pending"),
    ("accepted", "Accepted"),
    ("ongoing", "Ongoing"),
    ("completed", "Completed"),
    ("cancelled", "Cancelled"),
]

BOOKING_TYPES = [
    ("normal", "Normal"),
    ("luxury", "Luxury"),
    ("subscription", "Subscription"),
    ("occasion", "Occasion"),
]


# ======================================================
# 🟣 LUXURY AI MODEL
# ======================================================

class LuxuryProfile(models.Model):
    name = models.CharField(max_length=100)

    min_driver_rating = models.FloatField(default=4.8)
    premium_multiplier = models.FloatField(default=1.8)

    preferred_vehicle = models.CharField(
        max_length=50,
        default="Mercedes / BMW"
    )

    chauffeur_dress_code = models.BooleanField(default=True)
    silent_ride = models.BooleanField(default=False)

    ai_priority_score = models.FloatField(default=1.0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ======================================================
# 🔵 SUBSCRIPTION AI MODEL
# ======================================================

class SubscriptionPlan(models.Model):
    PLAN_TYPES = [
        ("basic", "Basic"),
        ("pro", "Pro"),
        ("enterprise", "Enterprise"),
    ]

    name = models.CharField(max_length=100)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES)

    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_ride_limit = models.PositiveIntegerField()

    free_km_per_ride = models.PositiveIntegerField(default=10)

    ai_fraud_score = models.FloatField(default=0.0)
    auto_renew = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.plan_type})"


# ======================================================
# 🟢 OCCASION AI MODEL
# ======================================================

class OccasionService(models.Model):
    EVENT_TYPES = [
        ("wedding", "Wedding"),
        ("corporate", "Corporate"),
        ("tour", "Tour"),
        ("party", "Party"),
    ]

    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)

    event_date = models.DateField()
    event_duration_hours = models.PositiveIntegerField()

    vehicle_count = models.PositiveIntegerField(default=1)

    surge_multiplier = models.FloatField(default=1.2)
    ai_demand_score = models.FloatField(default=1.0)

    requires_uniform_driver = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} ({self.event_date})"


# ======================================================
# 🚕 MAIN BOOKING MODEL (SINGLE SOURCE OF TRUTH)
# ======================================================
class Ride(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rides"
    )

    driver = models.ForeignKey(
        Driver,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="rides"
    )

    pickup_location_text = models.CharField(max_length=500)
    drop_location_text = models.CharField(max_length=500)

    pickup_lat = models.DecimalField(max_digits=9, decimal_places=6)
    pickup_lon = models.DecimalField(max_digits=9, decimal_places=6)
    drop_lat = models.DecimalField(max_digits=9, decimal_places=6)
    drop_lon = models.DecimalField(max_digits=9, decimal_places=6)

    distance_km = models.FloatField()
    fare = models.DecimalField(max_digits=10, decimal_places=2)

    vehicle_type = models.CharField(max_length=20)
    quantity = models.PositiveIntegerField(default=1)

    booking_type = models.CharField(
        max_length=20,
        choices=[
            ("normal", "Normal"),
            ("luxury", "Luxury"),
            ("subscription", "Subscription"),
            ("occasion", "Occasion"),
        ],
        default="normal"
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("ongoing", "Ongoing"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
        default="pending"
    )

    ride_otp = models.CharField(max_length=6, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.ride_otp:
            self.ride_otp = str(random.randint(100000, 999999))
        super().save(*args, **kwargs)

# ======================================================
# 🔔 REAL-TIME DRIVER NOTIFICATION
# ======================================================

@receiver(post_save, sender=Ride)
def notify_driver_on_booking_create(sender, instance, created, **kwargs):
    if created and instance.driver:
        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            f"driver_{instance.driver.id}",
            {
                "type": "send_notification",
                "data": {
                    "booking_id": instance.id,
                    "pickup": instance.pickup_location_text,
                    "drop": instance.drop_location_text,
                    "fare": float(instance.fare),
                    "distance_km": instance.distance_km,
                    "vehicle_type": instance.vehicle_type,
                    "booking_type": instance.booking_type,
                },
            }
        )
