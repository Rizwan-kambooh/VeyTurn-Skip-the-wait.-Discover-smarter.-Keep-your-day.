import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useAuth} from '../auth/AuthContext';
import {Business, createBusinessRequest, getMyBusiness} from '../services/businesses';

export type BusinessDraft = {name: string; category: string; city: string; address: string; phone: string; imageUri?: string; latitude: number; longitude: number};
type SetupDetails = {branchName: string; branchAddress: string; operatingDays: number[]; opensAt: string; closesAt: string; services: string[]; maximumQueueSize: number};
type BusinessContextValue = {business: Business | null; draft: BusinessDraft | null; restoring: boolean; saveDraft: (draft: BusinessDraft) => void; createBusiness: (details: SetupDetails) => Promise<void>; refreshBusiness: () => Promise<void>};
const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({children}: {children: ReactNode}) {
  const {user, accessToken} = useAuth(); const [business, setBusiness] = useState<Business | null>(null); const [draft, setDraft] = useState<BusinessDraft | null>(null); const [restoring, setRestoring] = useState(true);
  const refreshBusiness = useCallback(async () => {
    if (!accessToken) {setBusiness(null); setRestoring(false); return;}
    setRestoring(true);
    try {setBusiness(await getMyBusiness(accessToken));} catch {setBusiness(null);} finally {setRestoring(false);}
  }, [accessToken]);
  useEffect(() => {setDraft(null); refreshBusiness();}, [accessToken, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const value = useMemo<BusinessContextValue>(() => ({business, draft, restoring, saveDraft: setDraft, refreshBusiness, createBusiness: async details => {
    if (!draft || !accessToken) throw new Error('Business details are missing.');
    const form = new FormData();
    form.append('name', draft.name); form.append('category', draft.category); form.append('city', draft.city); form.append('address', draft.address); form.append('phone', draft.phone); form.append('latitude', draft.latitude.toFixed(6)); form.append('longitude', draft.longitude.toFixed(6)); form.append('branch_name', details.branchName); form.append('branch_address', details.branchAddress); form.append('operating_days', JSON.stringify(details.operatingDays)); form.append('opens_at', details.opensAt); form.append('closes_at', details.closesAt); form.append('maximum_queue_size', String(details.maximumQueueSize)); form.append('services', JSON.stringify(details.services));
    if (draft.imageUri) form.append('image', {uri: draft.imageUri, type: 'image/jpeg', name: 'business-cover.jpg'} as unknown as Blob);
    const next = await createBusinessRequest(accessToken, form); setBusiness(next); setDraft(null);
  }}), [accessToken, business, draft, restoring]); // eslint-disable-line react-hooks/exhaustive-deps
  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {const context = useContext(BusinessContext); if (!context) throw new Error('useBusiness must be used inside BusinessProvider.'); return context;}
