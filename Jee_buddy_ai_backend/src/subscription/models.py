from django.db import models
from django.contrib.auth.models import User
import uuid

class Subscription(models.Model):
    user_id = models.UUIDField()
    subscription_id = models.CharField(max_length=255)
    plan_id = models.CharField(max_length=255)
    status = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='INR')
    payment_id = models.CharField(max_length=255, null=True, blank=True)
    payment_status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    valid_till = models.DateTimeField(null=True, blank=True)
    metadata = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Subscription {self.subscription_id} - User {self.user_id}"

    class Meta:
        ordering = ['-created_at']

