import {apiRequest} from './api';

export type Service = {id: string; name: string; duration_minutes: number};
export type Business = {
  id: string; name: string; category: string; city: string; address: string; phone: string;
  image_url: string | null; latitude: string; longitude: string; branch_name: string; branch_address: string;
  operating_days: number[]; opens_at: string; closes_at: string; maximum_queue_size: number; is_active: boolean; rating_average: string; rating_count: number;
  distance_km: number | null; is_open: boolean; is_saved: boolean; people_waiting: number; estimated_wait_minutes: number; services: Service[];
};
export type QueueEntry = {id: string; token: string; status: 'waiting' | 'serving' | 'completed' | 'cancelled'; joined_at: string; called_at: string | null; completed_at: string | null; business: Business; service: Service; people_ahead: number; estimated_wait_minutes: number; now_serving_token: string | null; rating_score: number | null};
export type OwnerQueueEntry = {id: string; token: string; status: 'waiting' | 'serving' | 'completed' | 'cancelled'; joined_at: string; called_at: string | null; completed_at: string | null; waited_minutes: number; customer: {id: string; full_name: string; email: string; phone_number: string}; service: Service; rating_score: number | null};
export type BusinessAnalytics = {total_visits: number; completed_visits: number; cancelled_visits: number; active_queue: number; average_wait_minutes: number; measured_wait_visits: number; excluded_stale_visits: number; top_services: {name: string; count: number}[]};
export type LocationSuggestion = {label: string; city: string; latitude: number; longitude: number};
type BusinessList = {count: number; results: Business[]};

export function getBusinesses(accessToken: string, coordinates: {latitude: number; longitude: number}, options: {category?: string; search?: string; filter?: string} = {}) {
  const params = new URLSearchParams({lat: String(coordinates.latitude), lng: String(coordinates.longitude)});
  if (options.category && options.category !== 'All') params.set('category', options.category);
  if (options.search) params.set('search', options.search);
  if (options.filter && options.filter !== 'All') params.set('filter', options.filter.toLowerCase().replace(' ', '_'));
  return apiRequest<BusinessList>(`/businesses/?${params}`, {accessToken});
}

export function getBusiness(accessToken: string, id: string, coordinates?: {latitude: number; longitude: number}) {
  const query = coordinates ? `?lat=${coordinates.latitude}&lng=${coordinates.longitude}` : '';
  return apiRequest<Business>(`/businesses/${id}/${query}`, {accessToken});
}

export function getMyBusiness(accessToken: string) {return apiRequest<Business | null>('/businesses/mine/', {accessToken});}
export function createBusinessRequest(accessToken: string, form: FormData) {return apiRequest<Business>('/businesses/', {method: 'POST', accessToken, body: form});}
export function joinQueue(accessToken: string, businessId: string, serviceId: string) {return apiRequest<QueueEntry>(`/businesses/${businessId}/queue/join/`, {method: 'POST', accessToken, body: {service_id: serviceId}});}
export function getActiveQueue(accessToken: string) {return apiRequest<QueueEntry | null>('/businesses/queue/active/', {accessToken});}
export function getBusinessActiveQueue(accessToken: string, businessId: string) {return apiRequest<QueueEntry | null>(`/businesses/${businessId}/queue/active/`, {accessToken});}
export function getQueueEntry(accessToken: string, entryId: string) {return apiRequest<QueueEntry>(`/businesses/queue/entries/${entryId}/`, {accessToken});}
export function getQueueHistory(accessToken: string) {return apiRequest<{count: number; results: QueueEntry[]}>('/businesses/queue/history/', {accessToken});}
export function rateQueueEntry(accessToken: string, entryId: string, score: number) {return apiRequest<QueueEntry>(`/businesses/queue/entries/${entryId}/rating/`, {method: 'POST', accessToken, body: {score}});}
export function cancelQueueEntry(accessToken: string, entryId: string) {return apiRequest<QueueEntry>(`/businesses/queue/entries/${entryId}/cancel/`, {method: 'POST', accessToken});}
export function getSavedBusinesses(accessToken: string) {return apiRequest<BusinessList>('/businesses/saved/', {accessToken});}
export function setBusinessSaved(accessToken: string, businessId: string, saved: boolean) {return apiRequest<{is_saved: boolean}>(`/businesses/${businessId}/saved/`, {method: saved ? 'POST' : 'DELETE', accessToken});}
export function getOwnerQueue(accessToken: string) {return apiRequest<{count: number; results: OwnerQueueEntry[]}>('/businesses/owner/queue/', {accessToken});}
export function updateOwnerQueueEntry(accessToken: string, entryId: string, action: 'serve' | 'complete' | 'cancel') {return apiRequest<OwnerQueueEntry>(`/businesses/owner/queue/${entryId}/action/`, {method: 'POST', accessToken, body: {action}});}
export function getOwnerCustomers(accessToken: string) {return apiRequest<{count: number; results: OwnerQueueEntry[]}>('/businesses/owner/customers/', {accessToken});}
export function getOwnerAnalytics(accessToken: string) {return apiRequest<BusinessAnalytics>('/businesses/owner/analytics/', {accessToken});}
export function setOwnerBusinessActive(accessToken: string, isActive: boolean) {return apiRequest<Business>('/businesses/owner/status/', {method: 'POST', accessToken, body: {is_active: isActive}});}
export function searchLocations(query: string, coordinates?: {latitude: number; longitude: number}) {
  const params = new URLSearchParams({q: query});
  if (coordinates) {params.set('lat', String(coordinates.latitude)); params.set('lng', String(coordinates.longitude));}
  return apiRequest<{results: LocationSuggestion[]}>(`/businesses/locations/search/?${params}`);
}
export function reverseLocation(coordinates: {latitude: number; longitude: number}) {return apiRequest<LocationSuggestion>(`/businesses/locations/reverse/?lat=${coordinates.latitude}&lng=${coordinates.longitude}`);}
