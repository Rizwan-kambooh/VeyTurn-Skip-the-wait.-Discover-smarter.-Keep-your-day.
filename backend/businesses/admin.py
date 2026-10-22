from django.contrib import admin

from .models import Business, QueueEntry, QueueRating, Service


class ServiceInline(admin.TabularInline):
    model = Service
    extra = 0


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'city', 'owner', 'is_active', 'rating_average')
    list_filter = ('category', 'city', 'is_active')
    search_fields = ('name', 'address', 'owner__email')
    inlines = (ServiceInline,)


@admin.register(QueueEntry)
class QueueEntryAdmin(admin.ModelAdmin):
    list_display = ('token', 'business', 'customer', 'service', 'status', 'joined_at')
    list_filter = ('status', 'business')


@admin.register(QueueRating)
class QueueRatingAdmin(admin.ModelAdmin):
    list_display = ('entry', 'score', 'created_at')
    list_filter = ('score',)
