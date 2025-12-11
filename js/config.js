(function() {
    const hostname = window.location.hostname;
    
    if (hostname === 'buka.tw' || hostname === 'www.buka.tw') {
        window.API_BASE_URL = 'https://api.buka.tw';
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
    
    window.loadImageWithAuth = async function(imgElement, url) {
        try {
            const response = await window.apiFetch(url);
            if (response.ok) {
                const blob = await response.blob();
                imgElement.src = URL.createObjectURL(blob);
            } else {
                console.error('載入圖片失敗:', response.status);
                imgElement.alt = '圖片載入失敗';
            }
        } catch (error) {
            console.error('載入圖片錯誤:', error);
            imgElement.alt = '圖片載入失敗';
        }
    };
    
    window.getAuthImageUrl = async function(url) {
        try {
            const response = await window.apiFetch(url);
            if (response.ok) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        } catch (error) {
            console.error('取得圖片錯誤:', error);
        }
        return null;
    };
})();
