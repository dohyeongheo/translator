/**
 * 애플리케이션 설정 상수
 * @type {Object}
 */
const CONFIG = {
    API_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    MODEL_NAME: 'gemini-2.5-flash-preview-09-2025',
    DESKTOP_BREAKPOINT: 768,
    TOAST_DURATION: 3000,
    ANIMATION_DURATION: 300,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RESIZE_DEBOUNCE_DELAY: 150,
    MAX_TEXT_LENGTH: 10000,
    API_KEY_STORAGE_KEY: 'gemini_api_key',
    MIN_API_KEY_LENGTH: 20,
    TTS_RATE: 0.9,
    API_TIMEOUT: 30000,
    // Supabase 설정 (사용자가 설정 모달에서 입력)
    SUPABASE_URL_STORAGE_KEY: 'supabase_url',
    SUPABASE_ANON_KEY_STORAGE_KEY: 'supabase_anon_key'
};

/**
 * 기본 API 키 (공개 사용 시 빈 문자열)
 * @type {string}
 */
const defaultApiKey = "";

