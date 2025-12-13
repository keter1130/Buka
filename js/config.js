(function() {
    const hostname = window.location.hostname;
    
    if (hostname === 'buka.tw' || hostname === 'www.buka.tw') {
        window.API_BASE_URL = 'https://api.buka.tw';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        window.API_BASE_URL = '';
    } else {
        window.API_BASE_URL = '';
    }
    
    console.log('[Buka Config] API Base URL:', window.API_BASE_URL);
    
    window.getJwtToken = function() {
        return localStorage.getItem('jwtToken') || '';
    };
    
    window.handleAuthError = function() {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('memberNo');
        localStorage.removeItem('role');
        localStorage.removeItem('nickname');
        localStorage.removeItem('points');
        alert('登入已過期，請重新登入');
        if (window.parent && window.parent !== window) {
            window.parent.location.href = window.parent.location.pathname.includes('dashboard') 
                ? '/dashboard.html' 
                : '/index.html';
        } else {
            window.location.href = '/index.html';
        }
    };
    
    const AUTH_WHITELIST = [
        '/users/login',
        '/users/register',
        '/users/forgot-password',
        '/users/reset-password'
    ];
    
    function isAuthWhitelisted(url) {
        return AUTH_WHITELIST.some(path => url.includes(path));
    }
    
    window.apiFetch = async function(url, options = {}) {
        options.headers = {
            'ngrok-skip-browser-warning': 'true',
            ...(options.headers || {})
        };
        
        const response = await fetch(url, options);
        
        if (response.status === 401 && !isAuthWhitelisted(url)) {
            window.handleAuthError();
            throw new Error('Authentication expired');
        }
        
        return response;
    };
    
    window.loadImageWithAuth = async function(imgElement, url) {
        try {
            const response = await fetch(url, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (response.ok) {
                const blob = await response.blob();
                imgElement.src = URL.createObjectURL(blob);
            } else if (response.status === 401) {
                window.handleAuthError();
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
            const response = await fetch(url, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (response.ok) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            } else if (response.status === 401) {
                window.handleAuthError();
            }
        } catch (error) {
            console.error('取得圖片錯誤:', error);
        }
        return null;
    };
    
    window.MEMBER_STATUS_MAP = {
        'PENDING': { label: '等待客服回覆', class: 'status-pending' },
        'PROCESSING': { label: '等待客服回覆', class: 'status-processing' },
        'REPLIED': { label: '客服已回覆', class: 'status-replied' },
        'CLOSED': { label: '已結案', class: 'status-closed' }
    };
    
    window.ADMIN_STATUS_MAP = {
        'PENDING': { label: '待處理', class: 'status-pending' },
        'PROCESSING': { label: '會員已回覆', class: 'status-processing' },
        'REPLIED': { label: '已回覆', class: 'status-replied' },
        'CLOSED': { label: '已結案', class: 'status-closed' }
    };
})();
