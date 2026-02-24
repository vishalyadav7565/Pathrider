from django.db import models
from users.models import User

class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    payment_method = models.CharField(max_length=50)  # e.g. Credit Card, PayPal
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True)  # Optional description of the payment
    def __str__(self):
        return f"Payment {self.id} - {self.user.username} - {self.amount} - {self.status}"
    
class Invoice(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE)
    invoice_number = models.CharField(max_length=100, unique=True)
    issued_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    billing_address = models.TextField()
    def __str__(self):
        return f"Invoice {self.invoice_number} for Payment {self.payment.id}"
    
    class driverPayout(models.Model):
        driver = models.ForeignKey(User, on_delete=models.CASCADE)
        amount = models.DecimalField(max_digits=10, decimal_places=2)
        status = models.CharField(max_length=20, choices=[
            ('pending', 'Pending'),
            ('processed', 'Processed'),
            ('failed', 'Failed'),
        ], default='pending')
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)
        payout_method = models.CharField(max_length=50)  # e.g. Bank Transfer, PayPal
        transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
        description = models.TextField(blank=True)  # Optional description of the payout
        def __str__(self):
            return f"Payout {self.id} - {self.driver.username} - {self.amount} - {self.status}"
        