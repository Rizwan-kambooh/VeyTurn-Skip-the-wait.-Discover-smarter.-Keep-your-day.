from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import PasswordResetChallenge, User

@admin.register(User)
class VeyturnUserAdmin(UserAdmin):
    ordering = ('email',)
    list_display = ('email', 'full_name', 'phone_number', 'is_active', 'is_staff')
    search_fields = ('email', 'full_name', 'phone_number')
    fieldsets = ((None, {'fields': ('email', 'password')}), ('Personal info', {'fields': ('full_name', 'phone_number', 'email_verified_at')}), ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}), ('Dates', {'fields': ('last_login', 'created_at', 'updated_at')}))
    readonly_fields = ('created_at', 'updated_at')
    add_fieldsets = ((None, {'classes': ('wide',), 'fields': ('email', 'phone_number', 'full_name', 'password1', 'password2', 'is_staff', 'is_active')}),)

@admin.register(PasswordResetChallenge)
class PasswordResetChallengeAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'expires_at', 'verified_at', 'used_at')
    readonly_fields = ('code_hash', 'created_at')

