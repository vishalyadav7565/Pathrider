from django.contrib.auth.models import AbstractUser
from django.db import models
import random


# --------------------------------------------------
# ✅ USER MODEL
# --------------------------------------------------
class User(AbstractUser):
    phone = models.CharField(max_length=15, unique=True)
    name = models.CharField(max_length=100)
    is_driver = models.BooleanField(default=False)

    def __str__(self):
        return self.username


# --------------------------------------------------
# ✅ DRIVER MODEL (UPDATED FOR DESIRIDES AUTO ASSIGN)
# --------------------------------------------------

class Driver(models.Model):

    user = models.OneToOneField(
        "User",
        on_delete=models.CASCADE,
        related_name="driver_profile"
    )

    license_number = models.CharField(max_length=50)
    vehicle_type = models.CharField(max_length=50)
    vehicle_number = models.CharField(max_length=30, blank=True, null=True)

    aadhar_number = models.CharField(max_length=20, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)

    profile_image = models.ImageField(upload_to="drivers/", blank=True, null=True)

    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # 🔥 NEW FIELDS REQUIRED FOR AUTO MATCHING
    is_online = models.BooleanField(default=False)   # Driver available for ride
    rating = models.FloatField(default=4.0)          # Smart driver selection

    # 📍 Location
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # 📏 Working radius
    working_radius_km = models.PositiveIntegerField(default=10)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Driver: {self.user.username} ({self.vehicle_type})"


# --------------------------------------------------
# ✅ DRIVER NOTIFICATION MODEL
# --------------------------------------------------
class DriverNotification(models.Model):
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=100)
    message = models.TextField()
    type = models.CharField(
        max_length=20,
        choices=[("ride", "Ride"), ("earning", "Earning"), ("system", "System")],
        default="system",
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.driver.user.name}"


# --------------------------------------------------
# ✅ OTP MODEL
# --------------------------------------------------
class OTP(models.Model):
    phone = models.CharField(max_length=15)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = str(random.randint(100000, 999999))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.phone} - {self.code}"
    
# --------------------------------------------------
# user model ends here      
# --------------------------------------------------
 
