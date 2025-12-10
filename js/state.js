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
    currentPage: 'translation', // 'translation' | 'vocabulary' | 'realtime'
    currentVocabularyLanguage: 'th', // 현재 선택된 언어
    // 실시간 번역 관련 상태
    realtimeSourceLang: 'auto',
    realtimeTargetLang: 'th',
    realtimeText: '',
    realtimeResult: '',
    realtimeDetectedSource: '',
    realtimeWordGuideSource: [],
    realtimeWordGuideTarget: [],
    realtimeRequestId: 0,
    // 선택 모달
    selectorModalOpen: false,
    selectorModalType: null
};

