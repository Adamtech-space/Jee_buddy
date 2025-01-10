from django.db import models
from django.utils import timezone

class Subscription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('pending', 'Pending')
    )

    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded')
    )

    user_id = models.CharField(max_length=255)
    subscription_id = models.CharField(max_length=255, unique=True)
    payment_id = models.CharField(max_length=255, null=True, blank=True)
    plan_id = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='INR')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    valid_till = models.DateTimeField(null=True, blank=True)
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )
    metadata = models.TextField(null=True, blank=True)  # Stores JSON data

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_id} - {self.subscription_id} ({self.status})"

    def is_active(self):
        return (
            self.status == 'active' and 
            self.payment_status == 'completed' and 
            (self.valid_till is None or self.valid_till > timezone.now())
        )

    def days_remaining(self):
        if not self.valid_till:
            return 0
        delta = self.valid_till - timezone.now()
        return max(0, delta.days)

    def save(self, *args, **kwargs):
        # Update the updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

