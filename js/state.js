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
    isDesktop: false,
    // 호버 툴팁 관련 상태
    currentWordGuide: [],
    currentTranslationText: '',
    currentDetectedSource: '',
    currentTargetLang: '',
    // 단어장 관련 상태
    savedWords: [], // 저장된 단어 ID 목록 (캐시)
    currentPage: 'translation', // 'translation' 또는 'vocabulary'
    currentVocabularyLanguage: 'th' // 현재 선택된 언어
};

