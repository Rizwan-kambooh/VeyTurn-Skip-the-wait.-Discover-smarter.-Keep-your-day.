import re

from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

PASSWORD = 'StrongPass1!'

class AuthenticationApiTests(APITestCase):
    def registration_payload(self):
        return {'full_name': 'Test User', 'email': 'test@example.com', 'phone_number': '+92 300 1234567', 'password': PASSWORD}

    def test_register_returns_tokens_and_normalizes_phone(self):
        response = self.client.post(reverse('register'), self.registration_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['phone_number'], '+923001234567')
        self.assertTrue(User.objects.get(email='test@example.com').check_password(PASSWORD))

    def test_login_accepts_email_or_phone(self):
        User.objects.create_user(email='test@example.com', phone_number='+923001234567', full_name='Test User', password=PASSWORD)
        for identifier in ('test@example.com', '+92 300 1234567'):
            response = self.client.post(reverse('login'), {'identifier': identifier, 'password': PASSWORD}, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('access', response.data)

    def test_login_distinguishes_unknown_account_and_wrong_password(self):
        unknown = self.client.post(
            reverse('login'),
            {'identifier': 'missing@example.com', 'password': PASSWORD},
            format='json',
        )
        self.assertEqual(unknown.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No account was found', unknown.data['detail'][0])

        User.objects.create_user(
            email='test@example.com',
            phone_number='+923001234567',
            full_name='Test User',
            password=PASSWORD,
        )
        incorrect = self.client.post(
            reverse('login'),
            {'identifier': 'test@example.com', 'password': 'WrongPass2!'},
            format='json',
        )
        self.assertEqual(incorrect.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Incorrect password', incorrect.data['detail'][0])

    def test_duplicate_email_and_phone_are_rejected(self):
        self.client.post(reverse('register'), self.registration_payload(), format='json')
        response = self.client.post(reverse('register'), self.registration_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        payload = self.registration_payload()
        payload['email'] = 'other@example.com'
        response = self.client.post(reverse('register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_password_reset_flow_changes_password(self):
        user = User.objects.create_user(email='test@example.com', phone_number='+923001234567', full_name='Test User', password=PASSWORD)
        request_response = self.client.post(reverse('password-reset-request'), {'email': user.email}, format='json')
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Veyturn verification code', mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].alternatives[0][1], 'text/html')
        self.assertIn('Your verification code', mail.outbox[0].alternatives[0][0])
        code = re.search(r'\b(\d{6})\b', mail.outbox[0].body).group(1)
        self.assertGreaterEqual(int(code), 100000)
        self.assertLessEqual(int(code), 999999)

        verify_response = self.client.post(reverse('password-reset-verify'), {'email': user.email, 'code': code}, format='json')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)

        new_password = 'AnotherPass2@'
        confirm_response = self.client.post(reverse('password-reset-confirm'), {
            'reset_token': verify_response.data['reset_token'],
            'password': new_password,
            'password_confirmation': new_password,
        }, format='json')
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password(new_password))

    def test_authenticated_user_can_update_profile_and_password(self):
        user = User.objects.create_user(email='profile@example.com', phone_number='+923009999999', full_name='Old Name', password=PASSWORD)
        self.client.force_authenticate(user)
        response = self.client.patch(reverse('me'), {
            'full_name': 'Updated Name',
            'current_password': PASSWORD,
            'new_password': 'UpdatedPass2@',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['full_name'], 'Updated Name')
        user.refresh_from_db()
        self.assertTrue(user.check_password('UpdatedPass2@'))

        invalid = self.client.patch(reverse('me'), {
            'current_password': 'wrong-password',
            'new_password': 'AnotherPass3#',
        }, format='json')
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', invalid.data)

    def test_reset_request_does_not_reveal_unknown_email(self):
        response = self.client.post(reverse('password-reset-request'), {'email': 'unknown@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_password_reset_resend_has_server_side_cooldown(self):
        user = User.objects.create_user(email='cooldown@example.com', phone_number='+923001111111', full_name='Cooldown User', password=PASSWORD)
        first = self.client.post(reverse('password-reset-request'), {'email': user.email}, format='json')
        second = self.client.post(reverse('password-reset-request'), {'email': user.email}, format='json')
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(second.data['retry_after'], 60)
