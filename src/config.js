const getApiUrl = () => {
    // 1. Prioritize environment variables (best for all deployments)
    if (import.meta.env.VITE_API_URL) {
        console.log('📡 Saarthi Nexus API Using Environment Variable:', import.meta.env.VITE_API_URL);
        return import.meta.env.VITE_API_URL;
    }

    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    // 2. Automated Production detection
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const prod_api = 'https://saarthi-nexus.onrender.com';
        console.log('📡 Saarthi Nexus API Production Detection:', prod_api);
        return prod_api;
    }

    // 3. Default for Local development
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const url = `${protocol}//${hostname}:8000`;
    console.log('📡 Saarthi Nexus API Identified Localhost at:', url);
    return url;
};

export const API_URL = getApiUrl();
