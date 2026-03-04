const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    // Check if we are in production (hosted on Vercel or similar)
    if (hostname.includes('vercel.app') || hostname.includes('onrender.com')) {
        return 'https://saarthi-nexus.onrender.com';
    }

    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const url = `${protocol}//${hostname}:5000`;
    console.log('📡 Saarthi Nexus API identified at:', url);
    return url;
};

export const API_URL = getApiUrl();
