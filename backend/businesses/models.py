import uuid
from datetime import time

from django.conf import settings
from django.db import models


class Business(models.Model):
    CATEGORY_CHOICES = [(value, value) for value in ('Clinic', 'Lab', 'Salon', 'Bank', 'Restaurant', 'Workshop', 'Pharmacy', 'More')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='business')
    name = models.CharField(max_length=160)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    city = models.CharField(max_length=100, db_index=True)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    image = models.FileField(upload_to='businesses/', blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    branch_name = models.CharField(max_length=120, default='Main branch')
    branch_address = models.CharField(max_length=255)
    opens_at = models.TimeField(default=time(8, 0))
    closes_at = models.TimeField(default=time(22, 0))
    operating_days = models.JSONField(default=list)
    maximum_queue_size = models.PositiveIntegerField(default=50)
    is_active = models.BooleanField(default=True)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['category', 'city', 'is_active']), models.Index(fields=['latitude', 'longitude'])]
        ordering = ['name']

    def __str__(self):
        return self.name


class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=120)
    duration_minutes = models.PositiveSmallIntegerField(default=10)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business', 'name')
        ordering = ['name']


class SavedBusiness(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_businesses')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'business'], name='unique_saved_business')]
        ordering = ['-created_at']


class QueueEntry(models.Model):
    STATUS_CHOICES = [('waiting', 'Waiting'), ('serving', 'Serving'), ('completed', 'Completed'), ('cancelled', 'Cancelled')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='queue_entries')
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='queue_entries')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='queue_entries')
    number = models.PositiveIntegerField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='waiting', db_index=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    called_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['business', 'number'], name='unique_business_queue_number'),
            models.UniqueConstraint(fields=['customer'], condition=models.Q(status__in=['waiting', 'serving']), name='one_active_queue_per_customer'),
        ]
        indexes = [models.Index(fields=['business', 'status', 'number'])]
        ordering = ['number']

    @property
    def token(self):
        return f'A{self.number:03d}'


class QueueRating(models.Model):
    entry = models.OneToOneField(QueueEntry, on_delete=models.CASCADE, related_name='rating')
    score = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
