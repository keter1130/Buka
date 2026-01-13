/**
 * 密碼強度與 UI 工具函式庫
 * 用於 register.html 與 change-password.html
 */

/**
 * 計算密碼強度分數
 * @param {string} password
 * @returns {number} 0 (空) ~ 4 (強)
 */
function calculatePasswordStrength(password) {
    if (!password) return 0;

    let score = 0;

    // 1. 基礎長度檢查
    if (password.length >= 8) score += 1;

    // 2. 包含數字
    if (/\d/.test(password)) score += 1;

    // 3. 包含小寫字母
    if (/[a-z]/.test(password)) score += 1;

    // 4. 包含大寫字母
    if (/[A-Z]/.test(password)) score += 1;

    // 額外加分：特殊符號 (可選，但後端目前只強制大小寫數字)
    // if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // 修正：若長度不足 8，最高只能 2 分 (弱)
    if (password.length < 8 && score > 2) score = 2;

    // 修正：若長度超過 20，視為有效
    if (password.length > 20) score = 4; // 雖然 API 限制 20，但前端可先給高分

    return score;
}

/**
 * 取得強度文字與顏色
 */
function getStrengthInfo(score) {
    switch (score) {
        case 0: return { text: '', color: '#333', width: '0%' };
        case 1: return { text: '太短', color: '#ff5050', width: '25%' }; // 紅
        case 2: return { text: '弱', color: '#ff5050', width: '50%' };   // 紅
        case 3: return { text: '中', color: '#ffd700', width: '75%' };   // 黃
        case 4: return { text: '強', color: '#00f6ff', width: '100%' };  // 藍/綠
        default: return { text: '', color: '#333', width: '0%' };
    }
}

/**
 * 渲染強度條
 * @param {HTMLElement} container - 放置強度條的容器
 * @param {string} password - 當前密碼
 */
function updateStrengthMeter(container, password) {
    if (!container) return;

    const score = calculatePasswordStrength(password);
    const info = getStrengthInfo(score);

    // 清空容器
    container.innerHTML = '';

    // 建立進度條背景
    const barBg = document.createElement('div');
    barBg.style.height = '4px';
    barBg.style.width = '100%';
    barBg.style.backgroundColor = 'rgba(255,255,255,0.1)';
    barBg.style.borderRadius = '2px';
    barBg.style.marginTop = '8px';
    barBg.style.position = 'relative';
    barBg.style.overflow = 'hidden';

    // 建立進度條前景
    const barFg = document.createElement('div');
    barFg.style.height = '100%';
    barFg.style.width = info.width;
    barFg.style.backgroundColor = info.color;
    barFg.style.transition = 'width 0.3s, background-color 0.3s';

    barBg.appendChild(barFg);
    container.appendChild(barBg);

    // 建立文字提示
    const text = document.createElement('div');
    text.textContent = info.text;
    text.style.color = info.color;
    text.style.fontSize = '12px';
    text.style.marginTop = '4px';
    text.style.textAlign = 'right';
    text.style.transition = 'color 0.3s';

    container.appendChild(text);
}

/**
 * 切換密碼顯示/隱藏
 * @param {string} inputId
 * @param {HTMLElement} btn
 */
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈'; // 閉眼
    } else {
        input.type = 'password';
        btn.textContent = '👁'; // 睜眼
    }
}
