/**
 * 애플리케이션 전역 상태 관리
 * @type {Object}
 */
let state = {
    uiLang: 'ko',
    sourceLang: 'auto',
    targetLang: 'th',
    tone: 'polite',
    lastResult: '',
    lastLang: '',
    apiKey: defaultApiKey,
    isMobile: false,
    isDesktop: false
};

