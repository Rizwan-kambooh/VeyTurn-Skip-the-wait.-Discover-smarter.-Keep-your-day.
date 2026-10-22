import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.core import signing
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import PasswordResetChallenge, User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, UserUpdateSerializer, token_payload
from .validators import validate_strong_password

def hash_code(code):
    return hashlib.sha256(f'{settings.SECRET_KEY}:{code}'.encode()).hexdigest()

class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(token_payload(serializer.save()), status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(token_payload(serializer.validated_data['user']))

class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)

class LogoutView(APIView):
    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'refresh': ['This field is required.']}, status=400)
        try:
            RefreshToken(refresh).blacklist()
        except Exception:
            return Response({'detail': 'Invalid refresh token.'}, status=400)
        return Response(status=status.HTTP_204_NO_CONTENT)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'password_reset'
    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        cooldown_key = f'password-reset-cooldown:{hashlib.sha256(email.encode()).hexdigest()}'
        if not cache.add(cooldown_key, True, timeout=60):
            return Response(
                {'detail': 'Please wait before requesting another code.', 'retry_after': 60},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            PasswordResetChallenge.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())
            code = str(secrets.randbelow(900_000) + 100_000)
            PasswordResetChallenge.objects.create(user=user, code_hash=hash_code(code), expires_at=timezone.now() + timedelta(minutes=10))
            context = {'code': code, 'full_name': user.full_name, 'expires_in_minutes': 10}
            text_body = render_to_string('accounts/password_reset_email.txt', context)
            html_body = render_to_string('accounts/password_reset_email.html', context)
            email_message = EmailMultiAlternatives(
                subject=f'{code} is your Veyturn verification code',
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                reply_to=[settings.EMAIL_HOST_USER] if settings.EMAIL_HOST_USER else None,
            )
            email_message.attach_alternative(html_body, 'text/html')
            email_message.send()
        return Response({'detail': 'If that email is registered, a verification code has been sent.'})

class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'password_reset'
    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        code = str(request.data.get('code', '')).strip()
        challenge = PasswordResetChallenge.objects.filter(user__email__iexact=email, used_at__isnull=True).order_by('-created_at').first()
        if not challenge or challenge.expires_at <= timezone.now() or challenge.attempts >= 5:
            return Response({'detail': 'The verification code is invalid or expired.'}, status=400)
        challenge.attempts += 1
        if not secrets.compare_digest(challenge.code_hash, hash_code(code)):
            challenge.save(update_fields=['attempts'])
            return Response({'detail': 'The verification code is invalid or expired.'}, status=400)
        challenge.verified_at = timezone.now()
        challenge.save(update_fields=['attempts', 'verified_at'])
        reset_token = signing.dumps({'challenge_id': str(challenge.id), 'user_id': str(challenge.user_id)}, salt='password-reset')
        return Response({'reset_token': reset_token})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'password_reset'
    @transaction.atomic
    def post(self, request):
        reset_token = request.data.get('reset_token', '')
        password = request.data.get('password', '')
        password_confirmation = request.data.get('password_confirmation', '')
        if password != password_confirmation:
            return Response({'password_confirmation': ['Passwords do not match.']}, status=400)
        try:
            payload = signing.loads(reset_token, salt='password-reset', max_age=600)
            challenge = PasswordResetChallenge.objects.select_for_update().get(id=payload['challenge_id'], user_id=payload['user_id'], verified_at__isnull=False, used_at__isnull=True)
            validate_strong_password(password)
        except Exception:
            return Response({'detail': 'The reset session is invalid or expired.'}, status=400)
        user = challenge.user
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(password, user)
        except Exception as error:
            return Response({'password': list(getattr(error, 'messages', ['Choose a stronger password.']))}, status=400)
        user.set_password(password)
        user.save(update_fields=['password', 'updated_at'])
        challenge.used_at = timezone.now()
        challenge.save(update_fields=['used_at'])
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)
        return Response({'detail': 'Password updated successfully.'})


