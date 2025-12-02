/**
 * 유틸리티 함수 모음
 */

/**
 * 디바운스 함수 - 연속된 호출을 지연시킴
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 쓰로틀 함수 - 일정 시간 간격으로만 실행
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (ms)
 * @returns {Function} 쓰로틀된 함수
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * API 키 간단 암호화 (Base64 인코딩)
 * @param {string} key - API 키
 * @returns {string} 암호화된 키
 */
function encryptApiKey(key) {
    try {
        return btoa(key);
    } catch (e) {
        console.error('Encryption failed:', e);
        return key;
    }
}

/**
 * API 키 복호화 (Base64 디코딩)
 * @param {string} encryptedKey - 암호화된 키
 * @returns {string} 복호화된 키
 */
function decryptApiKey(encryptedKey) {
    try {
        return atob(encryptedKey);
    } catch (e) {
        console.error('Decryption failed:', e);
        return encryptedKey;
    }
}

/**
 * 디바이스 감지
 */
function detectDevice() {
    const width = window.innerWidth;
    const isDesktop = width >= CONFIG.DESKTOP_BREAKPOINT;

    state.isMobile = !isDesktop;
    state.isDesktop = isDesktop;

    // body에 클래스 추가/제거
    document.body.classList.toggle('is-mobile', state.isMobile);
    document.body.classList.toggle('is-desktop', state.isDesktop);

    // 컨테이너 너비 조정 (CSS 미디어 쿼리가 처리하므로 클래스만 제거)
    const container = document.querySelector('.container-wrapper');
    if (container) {
        container.classList.remove('max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-full');
        if (state.isMobile) {
            container.classList.add('max-w-full');
        } else {
            container.style.maxWidth = '';
        }
    }
}

/**
 * 안전한 텍스트 삽입 (XSS 방지)
 * @param {HTMLElement} element - 대상 요소
 * @param {string} text - 삽입할 텍스트
 */
function safeSetText(element, text) {
    if (!element) return;
    element.textContent = text;
}

/**
 * 안전한 HTML 삽입 (XSS 방지 - 신뢰할 수 있는 내용만)
 * @param {HTMLElement} element - 대상 요소
 * @param {string} html - 삽입할 HTML
 */
function safeSetHTML(element, html) {
    if (!element) return;
    // 기본적인 XSS 방지를 위해 DOMPurify 같은 라이브러리 사용 권장
    // 여기서는 간단히 innerHTML 사용 (신뢰할 수 있는 소스에서만)
    element.innerHTML = html;
}

