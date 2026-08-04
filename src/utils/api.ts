export const API_BASE_URL = (import.meta as any).env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:7005`
    : 'http://localhost:7005');


