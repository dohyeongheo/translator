/**
 * UI 제어 함수
 */

/**
 * 설정 모달 토글
 */
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    const input = document.getElementById('api-key-input');

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        // 복호화된 키 표시
        const savedKey = localStorage.getItem(CONFIG.API_KEY_STORAGE_KEY);
        if (savedKey) {
            try {
                input.value = decryptApiKey(savedKey);
            } catch (e) {
                input.value = savedKey; // 복호화 실패 시 원본 사용
            }
        } else {
            input.value = state.apiKey;
        }
        // 포커스 설정
        setTimeout(() => input.focus(), 100);
    } else {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
}

/**
 * API 키 저장
 */
function saveApiKey() {
    const input = document.getElementById('api-key-input');
    const newKey = input.value.trim();
    if (newKey) {
        state.apiKey = newKey;
        // 암호화하여 저장
        const encryptedKey = encryptApiKey(newKey);
        localStorage.setItem(CONFIG.API_KEY_STORAGE_KEY, encryptedKey);
        showToast(I18N[state.uiLang].apiKeySaved);
        toggleSettings();
    } else {
        showToast(I18N[state.uiLang].apiKeyRequired);
    }
}

/**
 * 라디오 버튼 그룹 설정
 * @param {string} groupId - 그룹 ID
 * @param {string} stateKey - 상태 키
 * @param {string} dataPath - 데이터 경로
 */
function setupRadioButtons(groupId, stateKey, dataPath) {
    const container = document.getElementById(groupId);
    if (!container) {
        console.warn(`Container with id "${groupId}" not found`);
        return;
    }
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('button').forEach(b => {
                b.classList.remove('active', 'border-blue-500', 'text-white', 'bg-blue-900/20');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active', 'border-blue-500', 'text-white', 'bg-blue-900/20');
            btn.setAttribute('aria-pressed', 'true');
            const val = dataPath.includes('tone') ? btn.dataset.tone : btn.dataset.lang;
            state[stateKey] = val;
        });
    });
}

/**
 * 활성 버튼 설정
 * @param {string} groupId - 그룹 ID
 * @param {string} val - 값
 * @param {...string} classes - 추가할 클래스
 */
function setActiveBtn(groupId, val, ...classes) {
    const container = document.getElementById(groupId);
    const selector = `[data-tone="${val}"]`;
    const btn = container.querySelector(selector);
    if (btn) btn.classList.add(...classes, 'active');
}

/**
 * 입력창 초기화
 */
function clearInput() {
    document.getElementById('input-text').value = '';
    document.getElementById('result-card').classList.add('hidden');
    const wordGuideSection = document.getElementById('word-guide-section');
    if (wordGuideSection) wordGuideSection.classList.add('hidden');
    document.getElementById('input-text').focus();
}

/**
 * 토스트 메시지 표시
 * @param {string} message - 메시지
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) return;

    // 기존 애니메이션 클래스 제거
    toast.classList.remove('show', 'hide', 'hidden');

    safeSetText(toastMessage, message);
    toast.classList.add('show');

    // 설정된 시간 후 페이드아웃 애니메이션과 함께 숨김
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');

        // 애니메이션 완료 후 완전히 숨김
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('hide');
        }, CONFIG.ANIMATION_DURATION);
    }, CONFIG.TOAST_DURATION);
}

/**
 * 결과 복사
 */
function copyResult() {
    navigator.clipboard.writeText(state.lastResult).then(() => {
        showToast(I18N[state.uiLang].copied);
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('복사 실패');
    });
}

/**
 * TTS 재생
 * @param {string} text - 재생할 텍스트
 * @param {string} lang - 언어 코드
 */
function playTTS(text, lang) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);

    if (lang === 'th') u.lang = 'th-TH';
    else if (lang === 'ko') u.lang = 'ko-KR';
    else if (lang === 'en') u.lang = 'en-US';
    else u.lang = 'th-TH';

    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

/**
 * 단어 가이드 표시
 * @param {Array} wordGuide - 단어 가이드 배열
 * @param {string} detectedSource - 감지된 소스 언어
 * @param {string} targetLang - 타겟 언어
 */
function displayWordGuide(wordGuide, detectedSource, targetLang) {
    const wordGuideSection = document.getElementById('word-guide-section');
    const wordGuideContent = document.getElementById('word-guide-content');

    if (!wordGuideSection || !wordGuideContent) return;

    // Hide if no word guide
    if (!wordGuide || !Array.isArray(wordGuide) || wordGuide.length === 0) {
        wordGuideSection.classList.add('hidden');
        return;
    }

    // Show section
    wordGuideSection.classList.remove('hidden');
    wordGuideContent.classList.add('hidden'); // Start collapsed

    // Clear previous content
    wordGuideContent.innerHTML = '';

    // Determine if we should show pronunciation (for Thai words)
    const hasThaiWords = detectedSource === 'th' || targetLang === 'th';

    // Create word guide items
    wordGuide.forEach((item, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'p-3 bg-gray-800/50 rounded-lg border border-gray-700';

        // 태국어 단어와 발음을 함께 표시: "태국어 단어 (한국어 발음)"
        const wordDisplay = hasThaiWords && item.pronunciation
            ? `${escapeHtml(item.word || '')} <span class="text-blue-300 font-medium">(${escapeHtml(item.pronunciation)})</span>`
            : escapeHtml(item.word || '');

        const meaning = escapeHtml(item.meaning || '');
        const example = item.example ? escapeHtml(item.example) : '';

        wordItem.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-blue-400 font-bold text-xs min-w-[24px]">${index + 1}.</span>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-white text-sm">${wordDisplay}</span>
                    </div>
                    <div class="text-gray-300 text-xs mb-1">
                        <span class="text-gray-500">${I18N[state.uiLang].meaning}:</span> ${meaning}
                    </div>
                    ${example ? `
                        <div class="text-gray-400 text-xs italic mt-1">
                            <span class="text-gray-500">${I18N[state.uiLang].example}:</span> ${example}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        wordGuideContent.appendChild(wordItem);
    });

    // Update i18n text
    const toggleText = document.getElementById('word-guide-toggle-text');
    if (toggleText && I18N[state.uiLang].wordGuide) {
        safeSetText(toggleText, I18N[state.uiLang].wordGuide);
    }
}

/**
 * 단어 가이드 토글
 */
function toggleWordGuide() {
    const wordGuideContent = document.getElementById('word-guide-content');
    const wordGuideIcon = document.getElementById('word-guide-icon');
    const toggleButton = document.querySelector('[onclick="toggleWordGuide()"]');

    if (!wordGuideContent || !wordGuideIcon) return;

    const isHidden = wordGuideContent.classList.contains('hidden');

    if (isHidden) {
        wordGuideContent.classList.remove('hidden');
        wordGuideIcon.classList.remove('fa-chevron-down');
        wordGuideIcon.classList.add('fa-chevron-up');
        if (toggleButton) toggleButton.setAttribute('aria-expanded', 'true');
    } else {
        wordGuideContent.classList.add('hidden');
        wordGuideIcon.classList.remove('fa-chevron-up');
        wordGuideIcon.classList.add('fa-chevron-down');
        if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
    }
}

/**
 * HTML 이스케이프 (XSS 방지)
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 초기화 함수
 */
function init() {
    // 디바이스 감지
    detectDevice();

    // 화면 크기 변경 시 재감지 (디바운싱 적용)
    const debouncedDetectDevice = debounce(detectDevice, CONFIG.RESIZE_DEBOUNCE_DELAY);
    window.addEventListener('resize', debouncedDetectDevice);

    // 저장된 API 키 로드 (복호화)
    const savedKey = localStorage.getItem(CONFIG.API_KEY_STORAGE_KEY);
    if (savedKey) {
        try {
            state.apiKey = decryptApiKey(savedKey);
        } catch (e) {
            state.apiKey = savedKey; // 복호화 실패 시 원본 사용
        }
    }

    // 라디오 버튼 설정
    setupRadioButtons('source-lang-group', 'sourceLang', 'dataset.lang');
    setupRadioButtons('target-lang-group', 'targetLang', 'dataset.lang');
    setupRadioButtons('nuance-group', 'tone', 'dataset.tone');

    setActiveBtn('nuance-group', 'polite', 'border-blue-500', 'text-white', 'bg-blue-900/20');

    // UI 언어 설정
    setUILang('ko');

    // 키보드 단축키 설정 (Ctrl+Enter로 번역)
    const inputText = document.getElementById('input-text');
    if (inputText) {
        inputText.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                executeTranslation();
            }
        });
    }

    // 설정 모달 ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('settings-modal');
            if (modal && !modal.classList.contains('hidden')) {
                toggleSettings();
            }
        }
    });
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init);

