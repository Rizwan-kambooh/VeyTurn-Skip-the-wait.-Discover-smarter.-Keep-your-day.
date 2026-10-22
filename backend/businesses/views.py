from django.db import transaction
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Business, QueueEntry, QueueRating, SavedBusiness
from .serializers import BusinessCreateSerializer, BusinessSerializer, JoinQueueSerializer, OwnerQueueEntrySerializer, QueueEntrySerializer, distance_km
from .geocoding import reverse_location, search_locations


def parse_coordinates(request, required=False):
    try:
        lat, lng = float(request.query_params.get('lat')), float(request.query_params.get('lng'))
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise ValueError
        return lat, lng
    except (TypeError, ValueError):
        if required:
            raise ValidationError({'location': 'Valid lat and lng query parameters are required.'})
        return None


class BusinessListCreateView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        coordinates = parse_coordinates(request, required=True)
        queryset = Business.objects.filter(is_active=True).prefetch_related('services').annotate(people_waiting_count=Count('queue_entries', filter=Q(queue_entries__status__in=['waiting', 'serving'])))
        category = request.query_params.get('category', '').strip()
        search = request.query_params.get('search', '').strip()
        mode = request.query_params.get('filter', 'all').lower()
        if category and category.lower() != 'all':
            queryset = queryset.filter(category__iexact=category)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(category__icontains=search) | Q(city__icontains=search) | Q(address__icontains=search) | Q(services__name__icontains=search)).distinct()
        businesses = list(queryset)
        businesses.sort(key=lambda item: distance_km(*coordinates, item.latitude, item.longitude))
        serializer = BusinessSerializer(businesses, many=True, context={'request': request, 'coordinates': coordinates})
        results = serializer.data
        if mode == 'open':
            results = [item for item in results if item['is_open']]
        elif mode == 'popular':
            results.sort(key=lambda item: (float(item['rating_average']), item['rating_count']), reverse=True)
        elif mode == 'near_me':
            results = [item for item in results if item['distance_km'] is not None and item['distance_km'] <= 10]
        return Response({'count': len(results), 'results': results})

    def post(self, request):
        if Business.objects.filter(owner=request.user).exists():
            return Response({'detail': 'You already have a registered business.'}, status=status.HTTP_409_CONFLICT)
        data = request.data.copy()
        if isinstance(data.get('services'), str):
            import json
            try:
                data['services'] = json.loads(data['services'])
            except json.JSONDecodeError:
                pass
        serializer = BusinessCreateSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        business = serializer.save()
        return Response(BusinessSerializer(business, context={'request': request}).data, status=status.HTTP_201_CREATED)


class MyBusinessView(APIView):
    def get(self, request):
        business = Business.objects.filter(owner=request.user).prefetch_related('services').first()
        return Response(BusinessSerializer(business, context={'request': request}).data if business else None)


class OwnerBusinessStatusView(APIView):
    def post(self, request):
        business = owner_business(request)
        is_active = request.data.get('is_active')
        if not isinstance(is_active, bool):
            return Response({'is_active': ['Use true or false.']}, status=400)
        business.is_active = is_active
        business.save(update_fields=['is_active', 'updated_at'])
        return Response(BusinessSerializer(business, context={'request': request}).data)


class BusinessDetailView(APIView):
    def get(self, request, pk):
        try:
            business = Business.objects.prefetch_related('services').get(pk=pk, is_active=True)
        except Business.DoesNotExist:
            return Response({'detail': 'Business not found.'}, status=404)
        coordinates = parse_coordinates(request)
        return Response(BusinessSerializer(business, context={'request': request, 'coordinates': coordinates}).data)


class SavedBusinessView(APIView):
    def post(self, request, pk):
        business = Business.objects.filter(pk=pk, is_active=True).first()
        if not business:
            return Response({'detail': 'Business not found.'}, status=404)
        SavedBusiness.objects.get_or_create(user=request.user, business=business)
        return Response({'is_saved': True})

    def delete(self, request, pk):
        SavedBusiness.objects.filter(user=request.user, business_id=pk).delete()
        return Response({'is_saved': False})


class SavedBusinessListView(APIView):
    def get(self, request):
        coordinates = parse_coordinates(request)
        businesses = Business.objects.filter(
            is_active=True,
            saved_by__user=request.user,
        ).prefetch_related('services').annotate(
            people_waiting_count=Count('queue_entries', filter=Q(queue_entries__status__in=['waiting', 'serving']))
        ).order_by('-saved_by__created_at')
        serializer = BusinessSerializer(businesses, many=True, context={'request': request, 'coordinates': coordinates})
        return Response({'count': businesses.count(), 'results': serializer.data})


class JoinQueueView(APIView):
    def post(self, request, pk):
        try:
            business = Business.objects.get(pk=pk, is_active=True)
        except Business.DoesNotExist:
            return Response({'detail': 'Business not found.'}, status=404)
        local_now = timezone.localtime()
        operating_days = business.operating_days or list(range(7))
        now_time = local_now.time()
        within_hours = business.opens_at <= now_time <= business.closes_at if business.opens_at < business.closes_at else now_time >= business.opens_at or now_time <= business.closes_at
        if local_now.weekday() not in operating_days or not within_hours:
            return Response({'detail': 'This business is currently closed.', 'code': 'business_closed'}, status=400)
        existing = QueueEntry.objects.filter(customer=request.user, business=business, status__in=['waiting', 'serving']).select_related('business', 'service').first()
        if existing:
            return Response({'detail': 'You have already joined this business queue.', 'code': 'already_joined', 'entry': QueueEntrySerializer(existing, context={'request': request}).data}, status=status.HTTP_409_CONFLICT)
        active_elsewhere = QueueEntry.objects.filter(customer=request.user, status__in=['waiting', 'serving']).select_related('business').first()
        if active_elsewhere:
            return Response({'detail': f'You already have an active token at {active_elsewhere.business.name}.', 'code': 'active_queue_exists'}, status=status.HTTP_409_CONFLICT)
        serializer = JoinQueueSerializer(data=request.data, context={'request': request, 'business': business})
        serializer.is_valid(raise_exception=True)
        entry = serializer.save()
        return Response(QueueEntrySerializer(entry, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ActiveQueueView(APIView):
    def get(self, request):
        entry = QueueEntry.objects.filter(customer=request.user, status__in=['waiting', 'serving']).select_related('business', 'service').order_by('-joined_at').first()
        return Response(QueueEntrySerializer(entry, context={'request': request}).data if entry else None)


class BusinessActiveQueueView(APIView):
    def get(self, request, pk):
        entry = QueueEntry.objects.filter(customer=request.user, business_id=pk, status__in=['waiting', 'serving']).select_related('business', 'service').first()
        return Response(QueueEntrySerializer(entry, context={'request': request}).data if entry else None)


class CustomerQueueEntryView(APIView):
    def get(self, request, pk):
        try:
            entry = QueueEntry.objects.select_related('business', 'service').get(pk=pk, customer=request.user)
        except QueueEntry.DoesNotExist:
            return Response({'detail': 'Queue entry not found.'}, status=404)
        return Response(QueueEntrySerializer(entry, context={'request': request}).data)


class CustomerQueueHistoryView(APIView):
    def get(self, request):
        entries = QueueEntry.objects.filter(customer=request.user, status__in=['completed', 'cancelled']).select_related('business', 'service', 'rating').order_by('-completed_at', '-joined_at')
        return Response({'count': entries.count(), 'results': QueueEntrySerializer(entries, many=True, context={'request': request}).data})


class CustomerQueueRatingView(APIView):
    @transaction.atomic
    def post(self, request, pk):
        try:
            entry = QueueEntry.objects.select_for_update().select_related('business', 'service').get(pk=pk, customer=request.user)
        except QueueEntry.DoesNotExist:
            return Response({'detail': 'Queue entry not found.'}, status=404)
        if entry.status != 'completed':
            return Response({'detail': 'Only a completed visit can be rated.'}, status=400)
        try:
            score = int(request.data.get('score'))
        except (TypeError, ValueError):
            return Response({'score': ['Choose a rating from 1 to 5.']}, status=400)
        if score not in range(1, 6):
            return Response({'score': ['Choose a rating from 1 to 5.']}, status=400)
        QueueRating.objects.update_or_create(entry=entry, defaults={'score': score})
        aggregate = QueueRating.objects.filter(entry__business=entry.business).aggregate(average=Avg('score'), count=Count('id'))
        entry.business.rating_average = round(aggregate['average'] or 0, 2)
        entry.business.rating_count = aggregate['count']
        entry.business.save(update_fields=['rating_average', 'rating_count', 'updated_at'])
        entry.refresh_from_db()
        return Response(QueueEntrySerializer(entry, context={'request': request}).data)


class CustomerQueueCancelView(APIView):
    @transaction.atomic
    def post(self, request, pk):
        try:
            entry = QueueEntry.objects.select_for_update().select_related('business', 'service').get(pk=pk, customer=request.user)
        except QueueEntry.DoesNotExist:
            return Response({'detail': 'Queue entry not found.'}, status=404)
        if entry.status not in ('waiting', 'serving'):
            return Response({'detail': 'This queue entry is already closed.'}, status=400)
        entry.status = 'cancelled'
        entry.completed_at = timezone.now()
        entry.save(update_fields=['status', 'completed_at'])
        return Response(QueueEntrySerializer(entry, context={'request': request}).data)


def owner_business(request):
    business = Business.objects.filter(owner=request.user).first()
    if not business:
        raise ValidationError({'detail': 'Register a business first.'})
    return business


class OwnerQueueView(APIView):
    def get(self, request):
        business = owner_business(request)
        entries = business.queue_entries.filter(status__in=['waiting', 'serving']).select_related('customer', 'service').order_by('number')
        return Response({'count': entries.count(), 'results': OwnerQueueEntrySerializer(entries, many=True).data})


class OwnerCustomersView(APIView):
    def get(self, request):
        business = owner_business(request)
        entries = business.queue_entries.select_related('customer', 'service').order_by('-joined_at')[:200]
        return Response({'count': len(entries), 'results': OwnerQueueEntrySerializer(entries, many=True).data})


class OwnerQueueActionView(APIView):
    @transaction.atomic
    def post(self, request, pk):
        business = owner_business(request)
        try:
            entry = QueueEntry.objects.select_for_update().select_related('customer', 'service').get(pk=pk, business=business)
        except QueueEntry.DoesNotExist:
            return Response({'detail': 'Queue customer not found.'}, status=404)
        action = request.data.get('action')
        if action == 'serve':
            if entry.status != 'waiting':
                return Response({'detail': 'Only a waiting customer can be called.'}, status=400)
            if business.queue_entries.filter(status='serving').exclude(pk=entry.pk).exists():
                return Response({'detail': 'Complete the customer currently being served first.'}, status=409)
            entry.status, entry.called_at = 'serving', timezone.now()
            entry.save(update_fields=['status', 'called_at'])
        elif action == 'complete':
            if entry.status not in ('waiting', 'serving'):
                return Response({'detail': 'This queue entry is already closed.'}, status=400)
            entry.status, entry.completed_at = 'completed', timezone.now()
            if not entry.called_at:
                entry.called_at = entry.completed_at
            entry.save(update_fields=['status', 'called_at', 'completed_at'])
        elif action == 'cancel':
            if entry.status not in ('waiting', 'serving'):
                return Response({'detail': 'This queue entry is already closed.'}, status=400)
            entry.status, entry.completed_at = 'cancelled', timezone.now()
            entry.save(update_fields=['status', 'completed_at'])
        else:
            return Response({'action': ['Use serve, complete, or cancel.']}, status=400)
        return Response(OwnerQueueEntrySerializer(entry).data)


class OwnerAnalyticsView(APIView):
    def get(self, request):
        business = owner_business(request)
        entries = list(business.queue_entries.select_related('service').all())
        completed = [item for item in entries if item.status == 'completed']
        # A queue is an in-day workflow. Entries left open overnight or for many
        # hours are stale sessions and should not distort the operational wait KPI.
        waits = []
        excluded_stale_visits = 0
        for item in completed:
            if not item.called_at:
                continue
            wait = max(0, (item.called_at - item.joined_at).total_seconds() / 60)
            stale_threshold = max(240, item.service.duration_minutes * 6)
            if wait > stale_threshold:
                excluded_stale_visits += 1
                continue
            waits.append(wait)
        services = {}
        for item in completed:
            services[item.service.name] = services.get(item.service.name, 0) + 1
        return Response({
            'total_visits': len(entries),
            'completed_visits': len(completed),
            'cancelled_visits': sum(item.status == 'cancelled' for item in entries),
            'active_queue': sum(item.status in ('waiting', 'serving') for item in entries),
            'average_wait_minutes': round(sum(waits) / len(waits)) if waits else 0,
            'measured_wait_visits': len(waits),
            'excluded_stale_visits': excluded_stale_visits,
            'top_services': [{'name': name, 'count': count} for name, count in sorted(services.items(), key=lambda pair: pair[1], reverse=True)],
        })


class LocationSearchView(APIView):
    permission_classes = (AllowAny,)
    throttle_scope = 'geocoding'

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 3:
            return Response({'results': []})
        coordinates = parse_coordinates(request)
        try:
            results = search_locations(query, *(coordinates or (None, None)))
        except Exception:
            return Response({'detail': 'Location suggestions are temporarily unavailable.'}, status=503)
        return Response({'results': results})


class LocationReverseView(APIView):
    permission_classes = (AllowAny,)
    throttle_scope = 'geocoding'

    def get(self, request):
        coordinates = parse_coordinates(request, required=True)
        try:
            result = reverse_location(*coordinates)
        except Exception:
            return Response({'detail': 'Could not resolve the current location.'}, status=503)
        if not result:
            return Response({'detail': 'No address was found for this location.'}, status=404)
        return Response(result)
