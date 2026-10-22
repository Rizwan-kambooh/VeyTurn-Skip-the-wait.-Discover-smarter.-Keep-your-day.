from datetime import time
from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, QueueEntry, Service


class BusinessApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='owner@example.com', phone_number='+923001111111', full_name='Owner', password='StrongPass1!')
        self.customer = User.objects.create_user(email='customer@example.com', phone_number='+923002222222', full_name='Customer', password='StrongPass1!')

    def create_business(self, owner=None, name='Nearby Lab', latitude=33.6844, longitude=73.0479, category='Lab'):
        business = Business.objects.create(owner=owner or self.user, name=name, category=category, city='Islamabad', address='Blue Area', phone='+923001111111', latitude=latitude, longitude=longitude, branch_address='Blue Area', opens_at=time(0, 0), closes_at=time(23, 59))
        Service.objects.create(business=business, name='Blood Test', duration_minutes=10)
        return business

    def test_discovery_requires_location_and_orders_nearest_first(self):
        near = self.create_business()
        second_owner = User.objects.create_user(email='far@example.com', phone_number='+923003333333', full_name='Far Owner', password='StrongPass1!')
        self.create_business(owner=second_owner, name='Far Lab', latitude=33.90, longitude=73.20)
        self.client.force_authenticate(self.customer)
        missing = self.client.get(reverse('business-list-create'))
        self.assertEqual(missing.status_code, 400)
        response = self.client.get(reverse('business-list-create'), {'lat': 33.68, 'lng': 73.04, 'category': 'Lab'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['id'], str(near.id))
        self.assertIsNotNone(response.data['results'][0]['distance_km'])

    def test_owner_can_only_register_one_business(self):
        self.client.force_authenticate(self.user)
        payload = {'name': 'My Salon', 'category': 'Salon', 'city': 'Islamabad', 'address': 'F-7', 'phone': '+923001111111', 'latitude': '33.720123456789', 'longitude': '73.050987654321', 'branch_name': 'Main', 'branch_address': 'F-7', 'operating_days': [0, 1, 2, 3, 4, 5], 'opens_at': '09:00', 'closes_at': '21:30', 'maximum_queue_size': 20, 'services': [{'name': 'Haircut', 'duration_minutes': 20}]}
        first = self.client.post(reverse('business-list-create'), payload, format='json')
        second = self.client.post(reverse('business-list-create'), payload, format='json')
        self.assertEqual(first.status_code, 201)
        self.assertEqual(first.data['operating_days'], [0, 1, 2, 3, 4, 5])
        self.assertEqual(first.data['opens_at'], '09:00:00')
        self.assertEqual(first.data['latitude'], '33.720123')
        self.assertEqual(first.data['longitude'], '73.050988')
        self.assertEqual(second.status_code, 409)

    def test_business_registration_accepts_react_native_multipart_json(self):
        self.client.force_authenticate(self.user)
        payload = {'name': 'Multipart Salon', 'category': 'Salon', 'city': 'Lahore', 'address': 'Gol Chakar', 'phone': '+923001111111', 'latitude': '31.123456789', 'longitude': '74.123456789', 'branch_name': 'Main', 'branch_address': 'Gol Chakar', 'operating_days': '[0,1,2,3,4,5,6]', 'opens_at': '08:00', 'closes_at': '22:00', 'maximum_queue_size': '50', 'services': '["Hair cut · 20 min"]'}
        response = self.client.post(reverse('business-list-create'), payload, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['operating_days'], [0, 1, 2, 3, 4, 5, 6])

    def test_join_queue_returns_calculated_position(self):
        business = self.create_business()
        service = business.services.first()
        ahead = User.objects.create_user(email='ahead@example.com', phone_number='+923004444444', full_name='Ahead', password='StrongPass1!')
        QueueEntry.objects.create(business=business, service=service, customer=ahead, number=1)
        self.client.force_authenticate(self.customer)
        response = self.client.post(reverse('join-queue', args=[business.id]), {'service_id': str(service.id)}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['token'], 'A002')
        self.assertEqual(response.data['people_ahead'], 1)
        self.assertEqual(response.data['estimated_wait_minutes'], 10)

    def test_business_active_queue_prevents_duplicate_join(self):
        business = self.create_business()
        service = business.services.first()
        self.client.force_authenticate(self.customer)
        first = self.client.post(reverse('join-queue', args=[business.id]), {'service_id': str(service.id)}, format='json')
        active = self.client.get(reverse('business-active-queue', args=[business.id]))
        duplicate = self.client.post(reverse('join-queue', args=[business.id]), {'service_id': str(service.id)}, format='json')
        self.assertEqual(first.status_code, 201)
        self.assertEqual(active.status_code, 200)
        self.assertEqual(active.data['id'], first.data['id'])
        self.assertEqual(duplicate.status_code, 409)
        self.assertEqual(duplicate.data['code'], 'already_joined')
        self.assertEqual(QueueEntry.objects.filter(customer=self.customer, business=business).count(), 1)

    def test_customer_can_cancel_only_their_active_queue_entry(self):
        business = self.create_business()
        entry = QueueEntry.objects.create(business=business, service=business.services.first(), customer=self.customer, number=1)
        self.client.force_authenticate(self.customer)
        response = self.client.post(reverse('customer-queue-cancel', args=[entry.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'cancelled')
        entry.refresh_from_db()
        self.assertIsNotNone(entry.completed_at)
        self.assertIsNone(self.client.get(reverse('active-queue')).data)

    def test_customer_cannot_hold_active_tokens_at_two_businesses(self):
        first = self.create_business()
        other_owner = User.objects.create_user(email='second@example.com', phone_number='+923006666666', full_name='Second Owner', password='StrongPass1!')
        second = self.create_business(owner=other_owner, name='Second Lab')
        self.client.force_authenticate(self.customer)
        joined = self.client.post(reverse('join-queue', args=[first.id]), {'service_id': str(first.services.first().id)}, format='json')
        rejected = self.client.post(reverse('join-queue', args=[second.id]), {'service_id': str(second.services.first().id)}, format='json')
        self.assertEqual(joined.status_code, 201)
        self.assertEqual(rejected.status_code, 409)
        self.assertEqual(rejected.data['code'], 'active_queue_exists')

    def test_owner_can_manage_customer_queue_and_analytics(self):
        business = self.create_business()
        service = business.services.first()
        entry = QueueEntry.objects.create(
            business=business,
            service=service,
            customer=self.customer,
            number=1,
        )
        self.client.force_authenticate(self.user)

        queue = self.client.get(reverse('owner-queue'))
        self.assertEqual(queue.status_code, 200)
        self.assertEqual(queue.data['count'], 1)
        self.assertEqual(queue.data['results'][0]['token'], 'A001')
        self.assertEqual(queue.data['results'][0]['customer']['full_name'], 'Customer')

        serving = self.client.post(
            reverse('owner-queue-action', args=[entry.id]),
            {'action': 'serve'},
            format='json',
        )
        self.assertEqual(serving.status_code, 200)
        self.assertEqual(serving.data['status'], 'serving')

        completed = self.client.post(
            reverse('owner-queue-action', args=[entry.id]),
            {'action': 'complete'},
            format='json',
        )
        self.assertEqual(completed.status_code, 200)
        self.assertEqual(completed.data['status'], 'completed')

        self.client.force_authenticate(self.customer)
        customer_status = self.client.get(reverse('customer-queue-entry', args=[entry.id]))
        self.assertEqual(customer_status.status_code, 200)
        self.assertEqual(customer_status.data['status'], 'completed')
        rating = self.client.post(reverse('customer-queue-rating', args=[entry.id]), {'score': 5}, format='json')
        self.assertEqual(rating.status_code, 200)
        self.assertEqual(rating.data['rating_score'], 5)
        history = self.client.get(reverse('customer-queue-history'))
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.data['count'], 1)
        self.assertEqual(history.data['results'][0]['rating_score'], 5)
        business.refresh_from_db()
        self.assertEqual(business.rating_count, 1)
        self.assertEqual(float(business.rating_average), 5.0)
        self.client.force_authenticate(self.user)

        self.assertEqual(self.client.get(reverse('owner-queue')).data['count'], 0)
        customers = self.client.get(reverse('owner-customers'))
        self.assertEqual(customers.data['count'], 1)
        self.assertEqual(customers.data['results'][0]['status'], 'completed')
        analytics = self.client.get(reverse('owner-analytics'))
        self.assertEqual(analytics.data['total_visits'], 1)
        self.assertEqual(analytics.data['completed_visits'], 1)
        self.assertEqual(analytics.data['active_queue'], 0)
        self.assertEqual(analytics.data['top_services'], [{'name': 'Blood Test', 'count': 1}])

    def test_owner_cannot_manage_another_business_queue(self):
        business = self.create_business()
        entry = QueueEntry.objects.create(
            business=business,
            service=business.services.first(),
            customer=self.customer,
            number=1,
        )
        other_owner = User.objects.create_user(
            email='other-owner@example.com',
            phone_number='+923005555555',
            full_name='Other Owner',
            password='StrongPass1!',
        )
        self.create_business(owner=other_owner, name='Other Lab')
        self.client.force_authenticate(other_owner)
        response = self.client.post(
            reverse('owner-queue-action', args=[entry.id]),
            {'action': 'cancel'},
            format='json',
        )
        self.assertEqual(response.status_code, 404)

    def test_owner_can_close_and_reopen_business(self):
        business = self.create_business()
        self.client.force_authenticate(self.user)
        closed = self.client.post(reverse('owner-business-status'), {'is_active': False}, format='json')
        self.assertEqual(closed.status_code, 200)
        business.refresh_from_db()
        self.assertFalse(business.is_active)
        opened = self.client.post(reverse('owner-business-status'), {'is_active': True}, format='json')
        self.assertEqual(opened.status_code, 200)
        business.refresh_from_db()
        self.assertTrue(business.is_active)

    def test_customer_can_save_and_remove_business(self):
        business = self.create_business()
        self.client.force_authenticate(self.customer)
        saved = self.client.post(reverse('saved-business', args=[business.id]))
        self.assertEqual(saved.status_code, 200)
        self.assertTrue(saved.data['is_saved'])
        detail = self.client.get(reverse('business-detail', args=[business.id]))
        self.assertTrue(detail.data['is_saved'])
        saved_list = self.client.get(reverse('saved-business-list'))
        self.assertEqual(saved_list.status_code, 200)
        self.assertEqual(saved_list.data['count'], 1)
        self.assertEqual(saved_list.data['results'][0]['id'], str(business.id))
        self.assertIn('image_url', saved_list.data['results'][0])
        removed = self.client.delete(reverse('saved-business', args=[business.id]))
        self.assertEqual(removed.status_code, 200)
        self.assertFalse(removed.data['is_saved'])

    @patch('businesses.views.search_locations')
    def test_location_search_returns_normalized_suggestions(self, search_mock):
        search_mock.return_value = [{'label': 'Sadar Gol Chakar, Lahore, Pakistan', 'city': 'Lahore', 'latitude': 31.5, 'longitude': 74.3}]
        response = self.client.get(reverse('location-search'), {'q': 'Sadar Gol Chakar', 'lat': 31.5, 'lng': 74.3})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['city'], 'Lahore')

    @patch('businesses.views.reverse_location')
    def test_reverse_location_returns_address_for_current_coordinates(self, reverse_mock):
        reverse_mock.return_value = {'label': 'Current Street, Lahore, Pakistan', 'city': 'Lahore', 'latitude': 31.5, 'longitude': 74.3}
        response = self.client.get(reverse('location-reverse'), {'lat': 31.5, 'lng': 74.3})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['label'], 'Current Street, Lahore, Pakistan')
