(function() {
    const hostname = window.location.hostname;
    
    // [Config] 設定 API 基礎路徑
    if (hostname === 'buka.tw' || hostname === 'www.buka.tw') {
        window.API_BASE_URL = 'https://api.buka.tw/api';
    } else {
        window.API_BASE_URL = '/api';
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
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/tickets/categories',
        '/api/shields/products'
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
        
        // 1. 處理 401/403 認證錯誤
        if ((response.status === 401 || response.status === 403) && !isAuthWhitelisted(url)) {
            window.handleAuthError();
            throw new Error('Authentication expired');
        }

        // 2. [Adapter] RFC 7807 ProblemDetail 適配器
        // 當後端回傳錯誤 (Status >= 400) 時，攔截 .json() 以適配舊前端格式
        if (!response.ok) {
            const originalJson = response.json.bind(response);
            response.json = async function() {
                try {
                    const data = await originalJson();

                    // A. 映射 detail -> message (讓舊前端能顯示錯誤訊息)
                    if (data && data.detail && !data.message) {
                        data.message = data.detail;
                    }

                    // B. 映射 title -> error (如果沒有 error 欄位)
                    if (data && data.title && !data.error) {
                        data.error = data.title;
                    }

                    // C. 標準化欄位錯誤 (Field Errors)
                    // Spring Boot ProblemDetail 可能將錯誤放在 'violations', 'properties.violations' 或 'errors'
                    let rawErrors = data.violations ||
                                  (data.properties && (data.properties.violations || data.properties.errors)) ||
                                  data.errors;

                    if (rawErrors) {
                        // [Fix] 如果是 Map (Object)，轉換為 Array
                        if (!Array.isArray(rawErrors) && typeof rawErrors === 'object') {
                            data.fieldErrors = Object.entries(rawErrors).map(([key, value]) => ({
                                field: key,
                                message: value
                            }));
                        } else {
                            data.fieldErrors = rawErrors;
                        }
                    }

                    return data;
                } catch (e) {
                    // 若 JSON 解析失敗，回傳空物件，避免前端炸裂
                    console.warn('[apiFetch] JSON Parse Error:', e);
                    return {};
                }
            };
        }
        
        return response;
    };

    // [New] 表單錯誤顯示工具
    // 自動將後端的 fieldErrors 顯示在對應的 input 下方
    window.showFormErrors = function(containerId, fieldErrors) {
        if (!fieldErrors || !Array.isArray(fieldErrors)) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        // 先清除舊錯誤
        window.clearFormErrors(containerId);

        fieldErrors.forEach(err => {
            // 支援 field 名稱 (如 'username') 或路徑 (如 'data.username')
            const fieldName = err.field || err.property;
            const message = err.message || err.defaultMessage;

            if (!fieldName) return;

            // 嘗試尋找對應的 input 元素
            // 優先找 name，其次找 id (假設 id 與 fieldName 相同)
            let input = container.querySelector(`[name="${fieldName}"]`);
            if (!input) {
                // 嘗試處理 'register-username' 這種帶前綴的 ID
                // 這裡做一個簡單的模糊匹配，或者依賴呼叫者傳入的 ID 規則
                // 目前策略：嘗試直接用 ID 找
                input = container.querySelector(`#${fieldName}`);

                // 如果還是找不到，嘗試組合 containerId 的前綴 (例如 register-form -> register-username)
                if (!input && containerId.includes('-')) {
                    const prefix = containerId.split('-')[0];
                    input = container.querySelector(`#${prefix}-${fieldName}`);
                }
            }

            if (input) {
                input.classList.add('is-invalid'); // Bootstrap 風格
                input.style.borderColor = '#ff5050';

                // 建立錯誤訊息 div
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.style.color = '#ff5050';
                errorDiv.style.fontSize = '12px';
                errorDiv.style.marginTop = '4px';
                errorDiv.style.textAlign = 'left';
                errorDiv.textContent = message;

                // 插入到 input 後面
                input.parentNode.insertBefore(errorDiv, input.nextSibling);
            }
        });
    };

    // [New] 清除表單錯誤
    window.clearFormErrors = function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 移除錯誤訊息文字
        const errorDivs = container.querySelectorAll('.invalid-feedback');
        errorDivs.forEach(div => div.remove());

        // 移除 input 的錯誤樣式
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            input.style.borderColor = ''; // 還原預設
        });
    };
    
    // [Security Fix] 使用 Blob URL + Header Auth (方案 C)
    window.loadImageWithAuth = async function(imgElement, url) {
        try {
            const token = window.getJwtToken();
            const cleanUrl = url.split('?')[0];

            const response = await fetch(cleanUrl, {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                if (imgElement.src && imgElement.src.startsWith('blob:')) {
                    URL.revokeObjectURL(imgElement.src);
                }
                imgElement.src = URL.createObjectURL(blob);
            } else {
                console.error('載入圖片失敗:', response.status, cleanUrl);
                imgElement.alt = '圖片載入失敗';
            }
        } catch (error) {
            console.error('載入圖片錯誤:', error, url);
            imgElement.alt = '圖片載入失敗';
        }
    };
    
    window.getAuthImageUrl = async function(url) {
        try {
            const token = window.getJwtToken();
            const cleanUrl = url.split('?')[0];

            const response = await fetch(cleanUrl, {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            } else {
                console.error('取得圖片 URL 失敗:', response.status, cleanUrl);
            }
        } catch (error) {
            console.error('取得圖片 URL 錯誤:', error, url);
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
