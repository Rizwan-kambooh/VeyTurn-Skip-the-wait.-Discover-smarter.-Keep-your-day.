import json
import hashlib
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache


def _label(properties):
    candidates = [
        properties.get('name'), properties.get('street'), properties.get('district'),
        properties.get('suburb'), properties.get('city'), properties.get('town'),
        properties.get('village'), properties.get('state'), properties.get('country'),
    ]
    return ', '.join(dict.fromkeys(str(value).strip() for value in candidates if value))


def _city(properties):
    return next((properties.get(key) for key in ('city', 'town', 'village', 'county', 'state') if properties.get(key)), '')


def _request(path, params):
    url = f"{settings.GEOCODING_BASE_URL.rstrip('/')}{path}?{urlencode(params)}"
    request = Request(url, headers={'User-Agent': settings.GEOCODING_USER_AGENT, 'Accept': 'application/geo+json,application/json'})
    with urlopen(request, timeout=6) as response:  # nosec: B310 - host is controlled by server settings
        return json.loads(response.read().decode('utf-8'))


def _normalize(feature):
    coordinates = feature.get('geometry', {}).get('coordinates', [])
    properties = feature.get('properties', {})
    if len(coordinates) < 2:
        return None
    return {'label': _label(properties), 'city': _city(properties), 'latitude': float(coordinates[1]), 'longitude': float(coordinates[0])}


def search_locations(query, latitude=None, longitude=None):
    fingerprint = hashlib.sha256(f'{query.lower()}:{latitude}:{longitude}'.encode()).hexdigest()
    key = f'geocode:search:{fingerprint}'
    cached = cache.get(key)
    if cached is not None:
        return cached
    params = {'q': query, 'limit': 5, 'lang': 'en'}
    if latitude is not None and longitude is not None:
        params.update({'lat': latitude, 'lon': longitude})
    results = [result for feature in _request('/api/', params).get('features', []) if (result := _normalize(feature)) and result['label']]
    cache.set(key, results, 86400)
    return results


def reverse_location(latitude, longitude):
    key = f"geocode:reverse:{round(latitude, 5)}:{round(longitude, 5)}"
    cached = cache.get(key)
    if cached is not None:
        return cached
    features = _request('/reverse', {'lat': latitude, 'lon': longitude, 'lang': 'en'}).get('features', [])
    result = _normalize(features[0]) if features else None
    cache.set(key, result, 86400)
    return result
