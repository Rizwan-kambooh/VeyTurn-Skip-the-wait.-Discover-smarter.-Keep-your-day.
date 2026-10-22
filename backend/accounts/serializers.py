from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .validators import normalize_phone, validate_strong_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'phone_number', 'email_verified_at', 'created_at')
        read_only_fields = fields


class UserUpdateSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)

    class Meta:
        model = User
        fields = ('full_name', 'current_password', 'new_password')

    def validate(self, attrs):
        new_password = attrs.get('new_password')
        if new_password:
            if not self.instance.check_password(attrs.get('current_password', '')):
                raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})
            validate_strong_password(new_password)
            try:
                password_validation.validate_password(new_password, self.instance)
            except DjangoValidationError as error:
                raise serializers.ValidationError({'new_password': list(error.messages)})
        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop('new_password', '')
        validated_data.pop('current_password', None)
        instance.full_name = validated_data.get('full_name', instance.full_name).strip()
        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'phone_number', 'password')

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return normalized

    def validate_phone_number(self, value):
        normalized = normalize_phone(value)
        if User.objects.filter(phone_number=normalized).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return normalized

    def validate_password(self, value):
        validate_strong_password(value)
        try:
            password_validation.validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        identifier = attrs['identifier'].strip()
        phone = ''
        if '@' not in identifier:
            try:
                phone = normalize_phone(identifier)
            except DjangoValidationError:
                pass
        user = User.objects.filter(Q(email__iexact=identifier) | Q(phone_number=phone)).first()
        if not user:
            raise serializers.ValidationError({
                'detail': 'No account was found with this email or phone number. Please create an account first.'
            })
        if not user.is_active:
            raise serializers.ValidationError({'detail': 'This account is inactive. Please contact support.'})
        if not user.check_password(attrs['password']):
            raise serializers.ValidationError({'detail': 'Incorrect password. Please try again.'})
        attrs['user'] = user
        return attrs

def token_payload(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh), 'user': UserSerializer(user).data}

