(function() {
    'use strict';
    
    function injectStyles() {
        if (document.getElementById('date-enhancer-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'date-enhancer-styles';
        style.textContent = `
            .date-picker-wrapper {
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            .date-picker-wrapper.full-width {
                display: flex;
                width: 100%;
            }
            .date-picker-wrapper input[type="date"] {
                flex: 1;
                min-width: 0;
            }
            .calendar-trigger-btn {
                background: transparent;
                border: 1px solid var(--border, rgba(255,255,255,0.2));
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            .calendar-trigger-btn:hover {
                border-color: var(--accent, #00f6ff);
                background: rgba(0,246,255,0.1);
            }
            .calendar-trigger-btn:focus {
                outline: none;
                border-color: var(--accent, #00f6ff);
            }
        `;
        document.head.appendChild(style);
    }
    
    function enhanceDateInputs() {
        const dateInputs = document.querySelectorAll('input[type="date"][data-enhance="calendar"]');
        
        dateInputs.forEach(function(input) {
            if (input.dataset.enhanced === 'true') return;
            if (input.type === 'hidden' || input.readOnly || input.disabled) return;
            
            input.dataset.enhanced = 'true';
            
            const wrapper = document.createElement('div');
            wrapper.className = 'date-picker-wrapper';
            
            if (input.classList.contains('full-width') || input.style.width === '100%') {
                wrapper.classList.add('full-width');
            }
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            
            const calendarBtn = document.createElement('button');
            calendarBtn.type = 'button';
            calendarBtn.className = 'calendar-trigger-btn';
            calendarBtn.innerHTML = '&#128197;';
            calendarBtn.title = '選擇日期';
            calendarBtn.setAttribute('aria-label', '開啟日曆選擇器');
            
            calendarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (typeof input.showPicker === 'function') {
                    try {
                        input.showPicker();
                    } catch (err) {
                        input.focus();
                        input.click();
                    }
                } else {
                    input.focus();
                    input.click();
                }
            });
            
            wrapper.appendChild(calendarBtn);
        });
    }
    
    function init() {
        injectStyles();
        enhanceDateInputs();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.enhanceDateInputs = enhanceDateInputs;
})();
