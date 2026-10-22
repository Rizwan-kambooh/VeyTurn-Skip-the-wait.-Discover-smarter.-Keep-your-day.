import math
import re
import json
import ast
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from rest_framework import serializers

from .models import Business, QueueEntry, Service


class CoordinateField(serializers.DecimalField):
    """Accept device/GPS precision while storing the model's six-decimal precision."""

    def validate_precision(self, value):
        rounded = value.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        return super().validate_precision(rounded)


class JSONListField(serializers.JSONField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except (TypeError, ValueError):
                try:
                    data = ast.literal_eval(data)
                except (SyntaxError, ValueError):
                    self.fail('invalid')
        if not isinstance(data, list):
            raise serializers.ValidationError('Expected a JSON list.')
        return data


def distance_km(lat1, lng1, lat2, lng2):
    radius = 6371.0
    p1, p2 = math.radians(float(lat1)), math.radians(float(lat2))
    dp = math.radians(float(lat2) - float(lat1))
    dl = math.radians(float(lng2) - float(lng1))
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ('id', 'name', 'duration_minutes')


class BusinessSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    distance_km = serializers.SerializerMethodField()
    is_open = serializers.SerializerMethodField()
    people_waiting = serializers.SerializerMethodField()
    estimated_wait_minutes = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ('id', 'name', 'category', 'city', 'address', 'phone', 'image_url', 'latitude', 'longitude', 'branch_name', 'branch_address', 'operating_days', 'opens_at', 'closes_at', 'maximum_queue_size', 'is_active', 'rating_average', 'rating_count', 'distance_km', 'is_open', 'is_saved', 'people_waiting', 'estimated_wait_minutes', 'services')

    def get_distance_km(self, obj):
        coordinates = self.context.get('coordinates')
        return round(distance_km(*coordinates, obj.latitude, obj.longitude), 2) if coordinates else None

    def get_is_open(self, obj):
        local_now = timezone.localtime()
        days = obj.operating_days or list(range(7))
        if local_now.weekday() not in days:
            return False
        now = local_now.time()
        within_hours = obj.opens_at <= now <= obj.closes_at if obj.opens_at < obj.closes_at else now >= obj.opens_at or now <= obj.closes_at
        return obj.is_active and within_hours

    def get_people_waiting(self, obj):
        return getattr(obj, 'people_waiting_count', obj.queue_entries.filter(status__in=['waiting', 'serving']).count())

    def get_estimated_wait_minutes(self, obj):
        waiting = self.get_people_waiting(obj)
        durations = [service.duration_minutes for service in obj.services.all() if service.is_active]
        return waiting * (round(sum(durations) / len(durations)) if durations else 10)

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

    def get_is_saved(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.saved_by.filter(user=request.user).exists())


class BusinessCreateSerializer(serializers.ModelSerializer):
    services = JSONListField(write_only=True)
    operating_days = JSONListField()
    latitude = CoordinateField(max_digits=9, decimal_places=6, min_value=Decimal('-90'), max_value=Decimal('90'))
    longitude = CoordinateField(max_digits=9, decimal_places=6, min_value=Decimal('-180'), max_value=Decimal('180'))

    class Meta:
        model = Business
        fields = ('name', 'category', 'city', 'address', 'phone', 'image', 'latitude', 'longitude', 'branch_name', 'branch_address', 'operating_days', 'opens_at', 'closes_at', 'maximum_queue_size', 'services')
        extra_kwargs = {'operating_days': {'required': True}, 'opens_at': {'required': True}, 'closes_at': {'required': True}}

    def validate_services(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError('Add at least one service.')
        return value

    def validate_operating_days(self, value):
        if not isinstance(value, list) or not value or any(not isinstance(day, int) or day < 0 or day > 6 for day in value):
            raise serializers.ValidationError('Select at least one valid working day.')
        return sorted(set(value))

    def validate(self, attrs):
        if attrs.get('opens_at') == attrs.get('closes_at'):
            raise serializers.ValidationError({'closes_at': 'Closing time must be different from opening time.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        services = validated_data.pop('services')
        business = Business.objects.create(owner=self.context['request'].user, **validated_data)
        for item in services:
            if isinstance(item, str):
                match = re.match(r'^(.*?)\s*·\s*(\d+)\s*min$', item)
                name, duration = (match.group(1), int(match.group(2))) if match else (item, 10)
            else:
                name, duration = item['name'], item.get('duration_minutes', 10)
            Service.objects.create(business=business, name=name.strip(), duration_minutes=max(1, int(duration)))
        return business


class QueueEntrySerializer(serializers.ModelSerializer):
    token = serializers.ReadOnlyField()
    business = BusinessSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    people_ahead = serializers.SerializerMethodField()
    estimated_wait_minutes = serializers.SerializerMethodField()
    now_serving_token = serializers.SerializerMethodField()
    rating_score = serializers.SerializerMethodField()

    class Meta:
        model = QueueEntry
        fields = ('id', 'token', 'status', 'joined_at', 'called_at', 'completed_at', 'business', 'service', 'people_ahead', 'estimated_wait_minutes', 'now_serving_token', 'rating_score')

    def get_rating_score(self, obj):
        rating = getattr(obj, 'rating', None)
        return rating.score if rating else None

    def get_people_ahead(self, obj):
        return obj.business.queue_entries.filter(status__in=['waiting', 'serving'], number__lt=obj.number).count()

    def get_estimated_wait_minutes(self, obj):
        return self.get_people_ahead(obj) * obj.service.duration_minutes

    def get_now_serving_token(self, obj):
        current = obj.business.queue_entries.filter(status='serving').order_by('number').first()
        return current.token if current else None


class OwnerQueueEntrySerializer(serializers.ModelSerializer):
    token = serializers.ReadOnlyField()
    service = ServiceSerializer(read_only=True)
    customer = serializers.SerializerMethodField()
    waited_minutes = serializers.SerializerMethodField()
    rating_score = serializers.SerializerMethodField()

    class Meta:
        model = QueueEntry
        fields = ('id', 'token', 'status', 'joined_at', 'called_at', 'completed_at', 'waited_minutes', 'customer', 'service', 'rating_score')

    def get_rating_score(self, obj):
        rating = getattr(obj, 'rating', None)
        return rating.score if rating else None

    def get_customer(self, obj):
        return {'id': str(obj.customer_id), 'full_name': obj.customer.full_name, 'email': obj.customer.email, 'phone_number': obj.customer.phone_number}

    def get_waited_minutes(self, obj):
        end = obj.called_at or timezone.now()
        return max(0, round((end - obj.joined_at).total_seconds() / 60))


class JoinQueueSerializer(serializers.Serializer):
    service_id = serializers.UUIDField()

    @transaction.atomic
    def create(self, validated_data):
        business = Business.objects.select_for_update().get(pk=self.context['business'].pk)
        customer = self.context['request'].user
        type(customer).objects.select_for_update().get(pk=customer.pk)
        existing = QueueEntry.objects.filter(customer=customer, business=business, status__in=['waiting', 'serving']).first()
        if existing:
            return existing
        active_count = business.queue_entries.filter(status__in=['waiting', 'serving']).count()
        if active_count >= business.maximum_queue_size:
            raise serializers.ValidationError({'detail': 'This queue is currently full.'})
        try:
            service = business.services.get(pk=validated_data['service_id'], is_active=True)
        except Service.DoesNotExist:
            raise serializers.ValidationError({'service_id': 'Choose a valid active service.'})
        number = (business.queue_entries.aggregate(maximum=Max('number'))['maximum'] or 0) + 1
        return QueueEntry.objects.create(business=business, service=service, customer=customer, number=number)
