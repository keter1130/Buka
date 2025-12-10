(function() {
    const hostname = window.location.hostname;
    
    if (hostname === 'buka.tw' || hostname === 'www.buka.tw') {
        window.API_BASE_URL = 'https://api.buka.tw/api';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        window.API_BASE_URL = '/api';
    } else {
        window.API_BASE_URL = '/api';
    }
    
    console.log('[Buka Config] API Base URL:', window.API_BASE_URL);
    
    window.apiFetch = function(url, options = {}) {
        options.headers = {
            'ngrok-skip-browser-warning': 'true',
            ...(options.headers || {})
        };
        return fetch(url, options);
    };
})();
