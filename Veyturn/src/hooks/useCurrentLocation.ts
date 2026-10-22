import {useCallback, useEffect, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type Coordinates = {latitude: number; longitude: number};

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
});

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), milliseconds);
    promise.then(value => {clearTimeout(timer); resolve(value);}, reason => {clearTimeout(timer); reject(reason);});
  });
}

export function useCurrentLocation({auto = true}: {auto?: boolean} = {}) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<Coordinates> => {
    setLoading(true); setError(null);
    try {
      if (Platform.OS === 'android') {
        const result = await withTimeout(PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION), 10000, 'Location permission request timed out.');
        if (result !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Location permission is required to find nearby businesses.');
      }
      return await withTimeout(new Promise<Coordinates>((resolve, reject) => Geolocation.getCurrentPosition(
        position => {const next = {latitude: position.coords.latitude, longitude: position.coords.longitude}; setCoordinates(next); setLoading(false); resolve(next);},
        reason => {const nextError = new Error(reason.message || 'Unable to determine your location.'); setError(nextError.message); setLoading(false); reject(nextError);},
        {enableHighAccuracy: false, timeout: 12000, maximumAge: 60000},
      )), 14000, 'Location request timed out. Make sure Location Services are enabled.');
    } catch (reason) {const nextError = reason instanceof Error ? reason : new Error('Unable to determine your location.'); setError(nextError.message); setLoading(false); throw nextError;}
  }, []);

  useEffect(() => {if (auto) refresh().catch(() => {});}, [auto, refresh]);
  return {coordinates, loading, error, refresh};
}
