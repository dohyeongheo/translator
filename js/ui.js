/**
 * UI 제어 함수
 */

/**
 * 설정 모달 토글
 */
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    const input = document.getElementById('api-key-input');

    if (!modal || !input) {
        console.error('Settings modal elements not found');
        return;
    }

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
            input.value = state.apiKey || '';
        }
        // 포커스 설정
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
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
    if (!input) {
        console.error('API key input element not found');
        return;
    }

    const newKey = input.value.trim();

    if (!newKey) {
        showToast(I18N[state.uiLang]?.apiKeyRequired || "Please enter API key.");
        return;
    }

    // API 키 기본 형식 검증 (최소 길이)
    if (newKey.length < CONFIG.MIN_API_KEY_LENGTH) {
        showToast(I18N[state.uiLang]?.apiKeyTooShort || "API key is too short. Must be at least 20 characters.");
        return;
    }

    state.apiKey = newKey;
    // 암호화하여 저장
    const encryptedKey = encryptApiKey(newKey);
    localStorage.setItem(CONFIG.API_KEY_STORAGE_KEY, encryptedKey);
    showToast(I18N[state.uiLang]?.apiKeySaved || "API key saved.");
    toggleSettings();
}

/**
 * 라디오 버튼 그룹 설정
 * @param {string} groupId - 그룹 ID
 * @param {string} stateKey - 상태 키
 * @param {string} dataPath - 데이터 경로
 */
function setupRadioButtons(groupId, stateKey, dataPath) {
    try {
        const container = document.getElementById(groupId);
        if (!container) {
            console.warn(`setupRadioButtons: Container with id "${groupId}" not found`);
            return;
        }

        const buttons = container.querySelectorAll('button');
        if (buttons.length === 0) {
            console.warn(`setupRadioButtons: No buttons found in container "${groupId}"`);
            return;
        }

        buttons.forEach(btn => {
            try {
                btn.addEventListener('click', () => {
                    try {
                        container.querySelectorAll('button').forEach(b => {
                            b.classList.remove('active', 'border-blue-500', 'text-white', 'bg-blue-900/20');
                            b.setAttribute('aria-pressed', 'false');
                        });
                        btn.classList.add('active', 'border-blue-500', 'text-white', 'bg-blue-900/20');
                        btn.setAttribute('aria-pressed', 'true');
                        const val = dataPath.includes('tone') ? btn.dataset.tone : btn.dataset.lang;
                        if (val && state.hasOwnProperty(stateKey)) {
                            state[stateKey] = val;
                        } else {
                            console.warn(`setupRadioButtons: Invalid value "${val}" or state key "${stateKey}"`);
                        }
                    } catch (error) {
                        console.error(`setupRadioButtons: Error handling button click:`, error);
                    }
                });
            } catch (error) {
                console.error(`setupRadioButtons: Error adding event listener to button:`, error);
            }
        });
    } catch (error) {
        console.error(`setupRadioButtons error for groupId "${groupId}":`, error);
    }
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
    const inputText = document.getElementById('input-text');
    const resultCard = document.getElementById('result-card');
    const wordGuideSection = document.getElementById('word-guide-section');

    if (inputText) {
        inputText.value = '';
        inputText.focus();
    }
    if (resultCard) {
        resultCard.classList.add('hidden');
    }
    if (wordGuideSection) {
        wordGuideSection.classList.add('hidden');
    }
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
    try {
        if (!state.lastResult) {
            console.warn('copyResult: No result to copy');
            showToast(I18N[state.uiLang]?.copied || "Nothing to copy");
            return;
        }

        // Clipboard API 지원 확인
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            console.error('copyResult: Clipboard API not supported');
            showToast(I18N[state.uiLang]?.copyFailed || "Copy failed");
            return;
        }

        navigator.clipboard.writeText(state.lastResult).then(() => {
            showToast(I18N[state.uiLang]?.copied || "Copied!");
        }).catch(err => {
            console.error('copyResult: Clipboard write failed:', err);
            showToast(I18N[state.uiLang]?.copyFailed || "Copy failed");
        });
    } catch (error) {
        console.error('copyResult error:', error);
        showToast(I18N[state.uiLang]?.copyFailed || "Copy failed");
    }
}

/**
 * TTS 재생
 * @param {string} text - 재생할 텍스트
 * @param {string} lang - 언어 코드
 */
function playTTS(text, lang) {
    if (!text || !text.trim()) {
        console.warn('TTS: Empty text provided');
        return;
    }

    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);

        // 언어 매핑
        const langMap = {
            'th': 'th-TH',
            'ko': 'ko-KR',
            'en': 'en-US'
        };

        u.lang = langMap[lang] || langMap['th'];
        u.rate = CONFIG.TTS_RATE;

        u.onerror = (event) => {
            console.error('TTS error:', event);
            showToast(I18N[state.uiLang]?.ttsError || "음성 재생 실패");
        };

        window.speechSynthesis.speak(u);
    } catch (error) {
        console.error('TTS failed:', error);
        showToast(I18N[state.uiLang]?.ttsError || "음성 재생 실패");
    }
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

    if (!wordGuideSection || !wordGuideContent) {
        console.error('Word guide section or content element not found');
        return;
    }

    // Hide if no word guide
    if (!wordGuide || !Array.isArray(wordGuide) || wordGuide.length === 0) {
        wordGuideSection.classList.add('hidden');
        return;
    }

    // Show section
    wordGuideSection.classList.remove('hidden');
    wordGuideContent.classList.add('hidden'); // Start collapsed

    // Clear previous content - innerHTML 대신 안전한 방법 사용
    while (wordGuideContent.firstChild) {
        wordGuideContent.removeChild(wordGuideContent.firstChild);
    }

    // Determine if we should show pronunciation (for Thai words)
    const hasThaiWords = detectedSource === 'th' || targetLang === 'th';

    // Create word guide items using safe DOM manipulation
    wordGuide.forEach((item, index) => {
        try {
            const wordItem = document.createElement('div');
            wordItem.className = 'p-3 bg-gray-800/50 rounded-lg border border-gray-700';

            // Container div
            const container = document.createElement('div');
            container.className = 'flex items-start gap-3';

            // Number span
            const numberSpan = document.createElement('span');
            numberSpan.className = 'text-blue-400 font-bold text-xs min-w-[24px]';
            safeSetText(numberSpan, `${index + 1}.`);

            // Content div
            const contentDiv = document.createElement('div');
            contentDiv.className = 'flex-1';

            // Word display div
            const wordDiv = document.createElement('div');
            wordDiv.className = 'flex items-center gap-2 mb-1';
            const wordSpan = document.createElement('span');
            wordSpan.className = 'font-bold text-white text-sm';

            if (hasThaiWords && item.pronunciation) {
                // 태국어 단어 표시
                safeSetText(wordSpan, item.word || '');
                const pronunciationSpan = document.createElement('span');
                pronunciationSpan.className = 'text-blue-300 font-medium';
                safeSetText(pronunciationSpan, ` (${item.pronunciation})`);
                wordSpan.appendChild(pronunciationSpan);
            } else {
                safeSetText(wordSpan, item.word || '');
            }
            wordDiv.appendChild(wordSpan);

            // Meaning div
            const meaningDiv = document.createElement('div');
            meaningDiv.className = 'text-gray-300 text-xs mb-1';
            const meaningLabel = document.createElement('span');
            meaningLabel.className = 'text-gray-500';
            const meaningLabelText = I18N[state.uiLang]?.meaning || '의미';
            safeSetText(meaningLabel, `${meaningLabelText}: `);
            const meaningText = document.createTextNode(item.meaning || '');
            meaningDiv.appendChild(meaningLabel);
            meaningDiv.appendChild(meaningText);

            // Assemble content div
            contentDiv.appendChild(wordDiv);
            contentDiv.appendChild(meaningDiv);

            // Example div (if exists)
            if (item.example) {
                const exampleDiv = document.createElement('div');
                exampleDiv.className = 'text-gray-400 text-xs italic mt-1';
                const exampleLabel = document.createElement('span');
                exampleLabel.className = 'text-gray-500';
                const exampleLabelText = I18N[state.uiLang]?.example || '예문';
                safeSetText(exampleLabel, `${exampleLabelText}: `);
                const exampleText = document.createTextNode(item.example);
                exampleDiv.appendChild(exampleLabel);
                exampleDiv.appendChild(exampleText);
                contentDiv.appendChild(exampleDiv);
            }

            // Assemble container
            container.appendChild(numberSpan);
            container.appendChild(contentDiv);
            wordItem.appendChild(container);
            wordGuideContent.appendChild(wordItem);
        } catch (error) {
            console.error(`Error creating word guide item ${index}:`, error);
        }
    });

    // Update i18n text
    const toggleText = document.getElementById('word-guide-toggle-text');
    if (toggleText && I18N[state.uiLang]?.wordGuide) {
        safeSetText(toggleText, I18N[state.uiLang].wordGuide);
    }
}

/**
 * 단어 가이드 토글
 */
function toggleWordGuide() {
    try {
        const wordGuideContent = document.getElementById('word-guide-content');
        const wordGuideIcon = document.getElementById('word-guide-icon');
        const toggleButton = document.querySelector('[onclick="toggleWordGuide()"]');

        if (!wordGuideContent || !wordGuideIcon) {
            console.warn('toggleWordGuide: wordGuideContent or wordGuideIcon not found');
            return;
        }

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
    } catch (error) {
        console.error('toggleWordGuide error:', error);
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
    try {
        // 디바이스 감지
        detectDevice();

        // 화면 크기 변경 시 재감지 (디바운싱 적용)
        try {
            const debouncedDetectDevice = debounce(detectDevice, CONFIG.RESIZE_DEBOUNCE_DELAY);
            window.addEventListener('resize', debouncedDetectDevice);
        } catch (error) {
            console.error('init: Error setting up resize listener:', error);
        }

        // 저장된 API 키 로드 (복호화)
        try {
            const savedKey = localStorage.getItem(CONFIG.API_KEY_STORAGE_KEY);
            if (savedKey) {
                try {
                    state.apiKey = decryptApiKey(savedKey);
                } catch (e) {
                    console.warn('init: API key decryption failed, using original:', e);
                    state.apiKey = savedKey; // 복호화 실패 시 원본 사용
                }
            }
        } catch (error) {
            console.error('init: Error loading API key from localStorage:', error);
        }

        // 라디오 버튼 설정
        try {
            setupRadioButtons('source-lang-group', 'sourceLang', 'dataset.lang');
            setupRadioButtons('target-lang-group', 'targetLang', 'dataset.lang');
            setupRadioButtons('nuance-group', 'tone', 'dataset.tone');
        } catch (error) {
            console.error('init: Error setting up radio buttons:', error);
        }

        try {
            setActiveBtn('nuance-group', 'polite', 'border-blue-500', 'text-white', 'bg-blue-900/20');
        } catch (error) {
            console.error('init: Error setting active button:', error);
        }

        // UI 언어 설정
        try {
            setUILang('ko');
        } catch (error) {
            console.error('init: Error setting UI language:', error);
        }

        // 키보드 단축키 설정 (Ctrl+Enter로 번역)
        try {
            const inputText = document.getElementById('input-text');
            if (inputText) {
                inputText.addEventListener('keydown', (e) => {
                    try {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            executeTranslation();
                        }
                    } catch (error) {
                        console.error('init: Error in keyboard shortcut handler:', error);
                    }
                });
            } else {
                console.warn('init: input-text element not found');
            }
        } catch (error) {
            console.error('init: Error setting up keyboard shortcuts:', error);
        }

        // 설정 모달 ESC 키로 닫기
        try {
            document.addEventListener('keydown', (e) => {
                try {
                    if (e.key === 'Escape') {
                        const modal = document.getElementById('settings-modal');
                        if (modal && !modal.classList.contains('hidden')) {
                            toggleSettings();
                        }
                    }
                } catch (error) {
                    console.error('init: Error in ESC key handler:', error);
                }
            });
        } catch (error) {
            console.error('init: Error setting up ESC key handler:', error);
        }
    } catch (error) {
        console.error('init: Critical initialization error:', error);
    }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init);

