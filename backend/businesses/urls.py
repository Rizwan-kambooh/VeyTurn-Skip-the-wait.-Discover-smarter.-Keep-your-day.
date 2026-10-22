from django.urls import path

from .views import ActiveQueueView, BusinessActiveQueueView, BusinessDetailView, BusinessListCreateView, CustomerQueueCancelView, CustomerQueueEntryView, CustomerQueueHistoryView, CustomerQueueRatingView, JoinQueueView, LocationReverseView, LocationSearchView, MyBusinessView, OwnerAnalyticsView, OwnerBusinessStatusView, OwnerCustomersView, OwnerQueueActionView, OwnerQueueView, SavedBusinessListView, SavedBusinessView

urlpatterns = [
    path('', BusinessListCreateView.as_view(), name='business-list-create'),
    path('mine/', MyBusinessView.as_view(), name='my-business'),
    path('queue/active/', ActiveQueueView.as_view(), name='active-queue'),
    path('queue/entries/<uuid:pk>/', CustomerQueueEntryView.as_view(), name='customer-queue-entry'),
    path('queue/history/', CustomerQueueHistoryView.as_view(), name='customer-queue-history'),
    path('queue/entries/<uuid:pk>/rating/', CustomerQueueRatingView.as_view(), name='customer-queue-rating'),
    path('queue/entries/<uuid:pk>/cancel/', CustomerQueueCancelView.as_view(), name='customer-queue-cancel'),
    path('saved/', SavedBusinessListView.as_view(), name='saved-business-list'),
    path('owner/queue/', OwnerQueueView.as_view(), name='owner-queue'),
    path('owner/queue/<uuid:pk>/action/', OwnerQueueActionView.as_view(), name='owner-queue-action'),
    path('owner/customers/', OwnerCustomersView.as_view(), name='owner-customers'),
    path('owner/analytics/', OwnerAnalyticsView.as_view(), name='owner-analytics'),
    path('owner/status/', OwnerBusinessStatusView.as_view(), name='owner-business-status'),
    path('locations/search/', LocationSearchView.as_view(), name='location-search'),
    path('locations/reverse/', LocationReverseView.as_view(), name='location-reverse'),
    path('<uuid:pk>/', BusinessDetailView.as_view(), name='business-detail'),
    path('<uuid:pk>/saved/', SavedBusinessView.as_view(), name='saved-business'),
    path('<uuid:pk>/queue/join/', JoinQueueView.as_view(), name='join-queue'),
    path('<uuid:pk>/queue/active/', BusinessActiveQueueView.as_view(), name='business-active-queue'),
]
