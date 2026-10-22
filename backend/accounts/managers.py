from django.contrib.auth.base_user import BaseUserManager

class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, phone_number, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required.')
        if not phone_number:
            raise ValueError('Phone number is required.')
        user = self.model(
            email=self.normalize_email(email).lower(),
            phone_number=phone_number,
            full_name=full_name.strip(),
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone_number, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, phone_number, full_name, password, **extra_fields)

