/**
 * Buka Server - 通用分頁組件 (Universal Pagination Component)
 *
 * 用途：
 * 1. 統一全站的分頁 UI 與行為。
 * 2. 支援 Spring Data Page<T> 結構。
 * 3. 自動生成「首頁、上一頁、頁碼、下一頁、末頁」按鈕。
 * 4. 顯示「共 X 筆 / 共 Y 頁」資訊。
 *
 * 依賴：
 * - Bootstrap 5 (CSS)
 * - FontAwesome (Icons) - 若無 FontAwesome，則使用文字替代
 */

const Pagination = {
    /**
     * 渲染分頁條
     * @param {Object} pageData - 後端回傳的 Page 物件 (content, totalPages, totalElements, number, first, last)
     * @param {String} containerId - 要插入分頁條的 HTML 容器 ID
     * @param {Function} fetchCallback - 當使用者點擊頁碼時要呼叫的函式 (例如 loadUsers)，會傳入 (page, size)
     */
    render: function(pageData, containerId, fetchCallback) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Pagination container '${containerId}' not found.`);
            return;
        }

        // 清空容器
        container.innerHTML = '';

        // [Fix] 結構適配：處理 ApiResponse 包裹 Page 的情況
        let content = [];
        let totalElements = 0;
        let totalPages = 0;
        let number = 0;

        if (pageData.page) {
            // Case A: 自定義結構 (content 與 page 分離)
            content = pageData.content || [];
            totalElements = pageData.page.totalElements || 0;
            totalPages = pageData.page.totalPages || 0;
            number = pageData.page.number || 0;
        } else {
            // Case B: 標準 Spring Data Page
            content = pageData.content || [];
            totalElements = pageData.totalElements || 0;
            totalPages = pageData.totalPages || 0;
            number = pageData.number || 0;
        }

        // 如果沒有資料，隱藏分頁條
        if (totalElements === 0) {
            container.innerHTML = '<div class="text-center text-muted py-3">無資料</div>';
            return;
        }

        // 1. 資訊區塊 (左側)
        const infoDiv = document.createElement('div');
        infoDiv.className = 'd-flex align-items-center';
        infoDiv.innerHTML = `
            <span class="text-muted small me-3">
                共 ${totalElements} 筆 / ${totalPages} 頁
            </span>
        `;

        // 2. 分頁按鈕區塊 (右側)
        const nav = document.createElement('nav');
        const ul = document.createElement('ul');
        ul.className = 'pagination pagination-sm mb-0';

        const currentPage = number; // 0-based

        // --- 首頁 & 上一頁 ---
        ul.appendChild(this.createPageItem('First', 0, currentPage === 0, fetchCallback));
        ul.appendChild(this.createPageItem('Prev', currentPage - 1, currentPage === 0, fetchCallback));

        // --- 頁碼 (顯示邏輯：最多顯示 5 個頁碼，當前頁置中) ---
        let startPage = Math.max(0, currentPage - 2);
        let endPage = Math.min(totalPages - 1, currentPage + 2);

        // 調整顯示範圍，確保盡量顯示 5 個
        if (endPage - startPage < 4) {
            if (startPage === 0) {
                endPage = Math.min(totalPages - 1, startPage + 4);
            } else if (endPage === totalPages - 1) {
                startPage = Math.max(0, endPage - 4);
            }
        }

        // 確保 endPage 不超過 totalPages - 1
        endPage = Math.min(endPage, totalPages - 1);

        for (let i = startPage; i <= endPage; i++) {
            ul.appendChild(this.createPageItem(i + 1, i, false, fetchCallback, i === currentPage));
        }

        // --- 下一頁 & 末頁 ---
        ul.appendChild(this.createPageItem('Next', currentPage + 1, currentPage === totalPages - 1, fetchCallback));
        ul.appendChild(this.createPageItem('Last', totalPages - 1, currentPage === totalPages - 1, fetchCallback));

        nav.appendChild(ul);

        // 3. 組合
        // 使用 flex-between 讓資訊在左，按鈕在右
        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex justify-content-between w-100';
        wrapper.appendChild(infoDiv);
        wrapper.appendChild(nav);

        container.appendChild(wrapper);
    },

    /**
     * 建立單個分頁按鈕 (內部方法)
     */
    createPageItem: function(label, pageIndex, disabled, callback, active = false) {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;

        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';

        // [Fix] 處理圖示顯示問題
        // 檢查是否已載入 FontAwesome，若無則使用文字替代
        const hasFontAwesome = document.querySelector('link[href*="font-awesome"]') || document.querySelector('link[href*="all.min.css"]');

        if (label === 'First') {
            a.innerHTML = hasFontAwesome ? '<i class="fas fa-angle-double-left"></i>' : '«';
            a.title = '第一頁';
        } else if (label === 'Prev') {
            a.innerHTML = hasFontAwesome ? '<i class="fas fa-angle-left"></i>' : '‹';
            a.title = '上一頁';
        } else if (label === 'Next') {
            a.innerHTML = hasFontAwesome ? '<i class="fas fa-angle-right"></i>' : '›';
            a.title = '下一頁';
        } else if (label === 'Last') {
            a.innerHTML = hasFontAwesome ? '<i class="fas fa-angle-double-right"></i>' : '»';
            a.title = '最後一頁';
        } else {
            a.innerText = label;
        }

        if (!disabled) {
            a.onclick = (e) => {
                e.preventDefault();
                // 呼叫 callback，預設 size 為 20 (或可從全域變數讀取)
                // 這裡我們只傳 page，讓 callback 自己決定 size
                callback(pageIndex);
            };
        }

        li.appendChild(a);
        return li;
    }
};
