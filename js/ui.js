/**
 * UI 제어 함수
 */


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
 * 선택 모달 관리
 */
const MODAL_OPTIONS = {
    source: [
        { value: 'auto', label: '자동' },
        { value: 'ko', label: '한국어' },
        { value: 'th', label: '태국어' },
        { value: 'en', label: '영어' },
    ],
    target: [
        { value: 'th', label: '태국어' },
        { value: 'en', label: '영어' },
        { value: 'ko', label: '한국어' },
    ],
    tone: [
        { value: 'polite', label: '예의 바르게' },
        { value: 'normal', label: '보통' },
        { value: 'casual', label: '편안하게' },
        { value: 'playful', label: '장난스럽게' },
    ]
};

function updateLangToneLabels() {
    const sourceLabel = document.getElementById('source-label');
    const targetLabel = document.getElementById('target-label');
    const toneLabel = document.getElementById('tone-label');
    const summarySource = document.getElementById('summary-source-label');
    const summaryTarget = document.getElementById('summary-target-label');
    const summaryTone = document.getElementById('summary-tone-label');
    const findLabel = (type, val) => (MODAL_OPTIONS[type].find(o => o.value === val) || {}).label || val;
    if (sourceLabel) safeSetText(sourceLabel, `출발어: ${findLabel('source', state.sourceLang)}`);
    if (targetLabel) safeSetText(targetLabel, `도착어: ${findLabel('target', state.targetLang)}`);
    if (toneLabel) safeSetText(toneLabel, `뉘앙스: ${findLabel('tone', state.tone)}`);
    if (summarySource) safeSetText(summarySource, `출발어: ${findLabel('source', state.sourceLang)}`);
    if (summaryTarget) safeSetText(summaryTarget, `도착어: ${findLabel('target', state.targetLang)}`);
    if (summaryTone) safeSetText(summaryTone, `뉘앙스: ${findLabel('tone', state.tone)}`);
}

function positionModalNearTrigger(modalEl, triggerEl) {
    if (!modalEl || !triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const modalWidth = 280;
    const padding = 8;
    // 모달을 트리거 버튼의 오른쪽 끝에서 모달 너비만큼 왼쪽으로 배치
    const leftOffset = rect.width - modalWidth; // 버튼 너비에서 모달 너비를 뺀 값만큼 왼쪽으로
    const left = Math.min(
        Math.max(rect.left + window.scrollX + leftOffset, padding),
        window.innerWidth - modalWidth - padding
    );
    const top = rect.bottom + window.scrollY + 8;
    modalEl.style.width = `${modalWidth}px`;
    modalEl.style.top = `${top}px`;
    modalEl.style.left = `${left}px`;
}

function openSelectorModal(type, triggerEl) {
    const backdrop = document.getElementById('selector-modal-backdrop');
    const list = document.getElementById('selector-modal-list');
    const title = document.getElementById('selector-modal-title');
    if (!backdrop || !list || !title) return;

    state.selectorModalOpen = true;
    state.selectorModalType = type;

    title.textContent = type === 'source' ? '출발어 선택' : type === 'target' ? '도착어 선택' : '뉘앙스 선택';
    list.innerHTML = '';
    const currentVal = type === 'source' ? state.sourceLang : type === 'target' ? state.targetLang : state.tone;
    MODAL_OPTIONS[type].forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center justify-between';
        btn.innerHTML = `<span>${opt.label}</span>${opt.value === currentVal ? '<i class="fas fa-check text-xs"></i>' : ''}`;
        btn.onclick = () => {
            if (type === 'source') state.sourceLang = opt.value;
            if (type === 'target') state.targetLang = opt.value;
            if (type === 'tone') state.tone = opt.value;
            updateLangToneLabels();
            closeSelectorModal();
            // 톤/언어 변경 시 기존 번역 적용
            if (type === 'tone' && state.lastResult) {
                // no-op for now
            }
        };
        list.appendChild(btn);
    });

    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');

    const modal = document.getElementById('selector-modal');
    positionModalNearTrigger(modal, triggerEl || document.body);
}

function closeSelectorModal() {
    const backdrop = document.getElementById('selector-modal-backdrop');
    if (!backdrop) return;
    state.selectorModalOpen = false;
    state.selectorModalType = null;
    backdrop.classList.add('hidden');
    backdrop.classList.remove('flex');
}

/**
 * 임의 텍스트 복사
 */
async function copyText(text) {
    if (!text) {
        showToast(I18N[state.uiLang]?.copyFailed || "Copy failed");
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        showToast(I18N[state.uiLang]?.copied || "Copied!");
    } catch (error) {
        console.error('copyText error:', error);
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
 * 예문에서 원문 텍스트 추출 (괄호 이전)
 * @param {string} example - 예문 텍스트
 * @returns {string} 괄호 이전의 원문 텍스트
 */
function extractOriginalTextFromExample(example) {
    if (!example) return '';
    // 괄호가 있으면 그 이전의 텍스트 추출
    const match = example.match(/^([^(]+)/);
    return match ? match[1].trim() : example.trim();
}

// 툴팁 관련 전역 변수
let currentTooltip = null;
let tooltipTimeout = null;

/**
 * 텍스트에서 단어 매칭
 * @param {string} text - 검색할 텍스트
 * @param {Array} wordGuide - 단어 가이드 배열
 * @returns {Array} 매칭된 단어 정보 배열 [{word, data, startIndex, endIndex}]
 */
function matchWordsInText(text, wordGuide) {
    if (!text || !wordGuide || wordGuide.length === 0) return [];

    const matches = [];
    const textLower = text.toLowerCase();

    wordGuide.forEach((item) => {
        if (!item.word) return;

        const searchWord = item.word.trim();
        if (!searchWord) return;

        // 부분 매칭: 텍스트에서 단어 찾기
        let searchIndex = 0;
        while (true) {
            const index = textLower.indexOf(searchWord.toLowerCase(), searchIndex);
            if (index === -1) break;

            matches.push({
                word: searchWord,
                data: item,
                startIndex: index,
                endIndex: index + searchWord.length
            });

            searchIndex = index + 1;
        }
    });

    // 시작 인덱스 순으로 정렬 (겹치는 경우 처리)
    matches.sort((a, b) => a.startIndex - b.startIndex);

    return matches;
}

/**
 * 번역 결과 텍스트에 툴팁 기능 부여
 */
function attachTooltipToTranslationResult() {
    const outputText = document.getElementById('output-text');
    if (!outputText || !state.currentWordGuide || state.currentWordGuide.length === 0) {
        return;
    }

    // 기존 툴팁 제거
    hideTooltip();

    const text = outputText.textContent || outputText.innerText;
    if (!text) return;

    // 기존 이벤트 리스너 제거 (중복 방지)
    const existingSpans = outputText.querySelectorAll('span[data-word-info]');
    existingSpans.forEach(span => {
        // 클론하여 이벤트 리스너 완전 제거
        const newSpan = span.cloneNode(true);
        span.parentNode.replaceChild(newSpan, span);
    });

    // 텍스트를 단어 단위로 분할하고 매칭
    const matches = matchWordsInText(text, state.currentWordGuide);

    if (matches.length === 0) return;

    // 텍스트를 span으로 감싸기
    let newHTML = '';
    let lastIndex = 0;

    matches.forEach((match) => {
        // 매칭 전 텍스트 추가
        if (match.startIndex > lastIndex) {
            newHTML += escapeHtml(text.substring(lastIndex, match.startIndex));
        }

        // 매칭된 단어를 span으로 감싸기
        const wordText = text.substring(match.startIndex, match.endIndex);
        newHTML += `<span class="tooltip-word cursor-help underline decoration-blue-400/50"
            data-word-info='${escapeHtml(JSON.stringify(match.data))}'>${escapeHtml(wordText)}</span>`;

        lastIndex = match.endIndex;
    });

    // 나머지 텍스트 추가
    if (lastIndex < text.length) {
        newHTML += escapeHtml(text.substring(lastIndex));
    }

    // HTML 설정 (안전하게)
    outputText.innerHTML = newHTML;

    // 이벤트 리스너 추가
    const wordSpans = outputText.querySelectorAll('span[data-word-info]');
    wordSpans.forEach(span => {
        span.addEventListener('mouseenter', handleWordHover);
        span.addEventListener('mouseleave', handleWordLeave);
        span.addEventListener('mousemove', handleWordMove);
    });
}

/**
 * 단어 호버 이벤트 핸들러
 */
function handleWordHover(event) {
    const wordDataStr = event.target.getAttribute('data-word-info');
    if (!wordDataStr) return;

    try {
        const wordData = JSON.parse(wordDataStr);
        showTooltip(event, wordData);
    } catch (error) {
        console.error('Failed to parse word data:', error);
    }
}

/**
 * 단어에서 벗어날 때 이벤트 핸들러
 */
function handleWordLeave() {
    hideTooltip();
}

/**
 * 단어 위에서 마우스 이동 이벤트 핸들러
 */
function handleWordMove(event) {
    if (currentTooltip) {
        updateTooltipPosition(event);
    }
}

/**
 * 툴팁 표시
 * @param {Event} event - 마우스 이벤트
 * @param {Object} wordData - 단어 데이터
 */
function showTooltip(event, wordData) {
    // 기존 툴팁 제거
    hideTooltip();

    // 툴팁 요소 생성
    const tooltip = document.createElement('div');
    tooltip.className = 'word-tooltip fixed z-50 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none';
    tooltip.style.background = 'var(--bg-card)';
    tooltip.style.color = 'var(--text-primary)';
    tooltip.style.border = '1px solid var(--border-color)';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s';

    // 툴팁 내용 구성
    let tooltipHTML = `<div class="font-bold text-sm mb-2">${escapeHtml(wordData.word || '')}</div>`;
    tooltipHTML += `<div class="text-xs mb-1" style="color: var(--text-secondary);"><span style="color: var(--text-tertiary);">${I18N[state.uiLang]?.meaning || '의미'}:</span> ${escapeHtml(wordData.meaning || '')}</div>`;

    if (wordData.pronunciation) {
        tooltipHTML += `<div class="text-xs" style="color: var(--accent-primary);"><span style="color: var(--text-tertiary);">${I18N[state.uiLang]?.pronunciation || '발음'}:</span> ${escapeHtml(wordData.pronunciation)}</div>`;
    }

    tooltip.innerHTML = tooltipHTML;
    document.body.appendChild(tooltip);
    currentTooltip = tooltip;

    // 위치 설정
    updateTooltipPosition(event);

    // 페이드 인
    setTimeout(() => {
        if (tooltip) {
            tooltip.style.opacity = '1';
        }
    }, 10);
}

/**
 * 툴팁 위치 업데이트
 * @param {Event} event - 마우스 이벤트
 */
function updateTooltipPosition(event) {
    if (!currentTooltip) return;

    const tooltip = currentTooltip;
    const x = event.clientX;
    const y = event.clientY;
    const offset = 10;

    // 기본 위치: 커서 오른쪽 아래
    let left = x + offset;
    let top = y + offset;

    // 화면 경계 체크
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 오른쪽으로 넘치면 왼쪽에 표시
    if (left + tooltipRect.width > windowWidth) {
        left = x - tooltipRect.width - offset;
    }

    // 아래로 넘치면 위에 표시
    if (top + tooltipRect.height > windowHeight) {
        top = y - tooltipRect.height - offset;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

/**
 * 툴팁 제거
 */
function hideTooltip() {
    if (currentTooltip) {
        // 즉시 제거 (애니메이션 없이)
        if (currentTooltip.parentNode) {
            currentTooltip.parentNode.removeChild(currentTooltip);
        }
        currentTooltip = null;
    }
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
}

/**
 * 단어/예문의 언어 결정
 * @param {Object} item - 단어 가이드 항목
 * @param {string} detectedSource - 감지된 소스 언어
 * @param {string} targetLang - 타겟 언어
 * @returns {string} 언어 코드 ('th', 'ko', 'en')
 */
function determineWordLanguage(item, detectedSource, targetLang) {
    // wordGuide의 단어는 일반적으로:
    // - source가 th이면 INPUT에서 추출한 태국어 단어
    // - target이 th이면 TRANSLATED TEXT에서 추출한 태국어 단어
    // - source가 en이면 INPUT에서 추출한 영어 단어
    // - target이 en이면 TRANSLATED TEXT에서 추출한 영어 단어
    // - source가 ko이면 INPUT에서 추출한 한국어 단어

    // pronunciation 필드가 있으면 태국어
    if (item.pronunciation) {
        return 'th';
    }

    // detectedSource와 targetLang을 기반으로 추정
    // 일반적으로 wordGuide는 번역된 텍스트(target)에서 추출되거나
    // 원본 텍스트(source)에서 추출됨
    if (targetLang === 'th' || detectedSource === 'th') {
        // 태국어 관련이면 태국어일 가능성이 높음
        // 하지만 pronunciation이 없으면 다른 언어일 수도 있음
        return 'th';
    }
    if (targetLang === 'en' || detectedSource === 'en') {
        return 'en';
    }
    if (targetLang === 'ko' || detectedSource === 'ko') {
        return 'ko';
    }

    // 기본값: 태국어
    return 'th';
}

/**
 * 단어 가이드 표시
 * @param {Array} wordGuide - 단어 가이드 배열
 * @param {string} detectedSource - 감지된 소스 언어
 * @param {string} targetLang - 타겟 언어
 */
async function displayWordGuide(wordGuide, detectedSource, targetLang) {
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

    // 저장된 단어 목록 조회 (비동기)
    // 각 단어의 언어를 결정하여 저장된 단어 확인
    const savedWordsPromises = wordGuide.map(async (item) => {
        const wordLang = determineWordLanguage(item, detectedSource, targetLang);
        const savedWords = await getSavedWords(wordLang);
        return { word: item.word, language: wordLang, isSaved: savedWords.has(item.word) };
    });

    const savedWordsData = await Promise.all(savedWordsPromises);
    const savedWordsMap = new Map();
    savedWordsData.forEach(({ word, language, isSaved }) => {
        savedWordsMap.set(`${word}_${language}`, isSaved);
    });

    // Create word guide items using safe DOM manipulation
    wordGuide.forEach((item, index) => {
        try {
            const wordItem = document.createElement('div');
            wordItem.className = 'p-3 rounded-lg';
            wordItem.style.background = 'var(--bg-secondary)';
            wordItem.style.border = '1px solid var(--border-color)';

            // Container div
            const container = document.createElement('div');
            container.className = 'flex items-start gap-3';

            // Number span
            const numberSpan = document.createElement('span');
            numberSpan.className = 'font-bold text-xs min-w-[24px]';
            numberSpan.style.color = 'var(--accent-primary)';
            safeSetText(numberSpan, `${index + 1}.`);

            // Content div
            const contentDiv = document.createElement('div');
            contentDiv.className = 'flex-1';

            // Word display div
            const wordDiv = document.createElement('div');
            wordDiv.className = 'flex items-center gap-2 mb-1';
            const wordSpan = document.createElement('span');
            wordSpan.className = 'font-bold text-sm tooltip-word cursor-help';
            wordSpan.style.color = 'var(--text-primary)';
            wordSpan.setAttribute('data-word-info', JSON.stringify(item));

            if (hasThaiWords && item.pronunciation) {
                // 태국어 단어 표시
                safeSetText(wordSpan, item.word || '');
                const pronunciationSpan = document.createElement('span');
                pronunciationSpan.className = 'font-medium';
                pronunciationSpan.style.color = 'var(--accent-primary)';
                safeSetText(pronunciationSpan, ` (${item.pronunciation})`);
                wordSpan.appendChild(pronunciationSpan);
            } else {
                safeSetText(wordSpan, item.word || '');
            }

            // 호버 이벤트 추가
            wordSpan.addEventListener('mouseenter', (e) => {
                showTooltip(e, item);
            });
            wordSpan.addEventListener('mouseleave', () => {
                hideTooltip();
            });
            wordSpan.addEventListener('mousemove', (e) => {
                if (currentTooltip) {
                    updateTooltipPosition(e);
                }
            });

            wordDiv.appendChild(wordSpan);

            // TTS 버튼 및 저장 버튼 추가 (단어/표현)
            if (item.word && item.word.trim()) {
                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'flex items-center gap-2';

                // TTS 버튼
                const wordTTSButton = document.createElement('button');
                wordTTSButton.className = 'transition';
                wordTTSButton.style.color = 'var(--accent-primary)';
                wordTTSButton.setAttribute('aria-label', I18N[state.uiLang]?.ttsPlay || '음성 재생');
                wordTTSButton.setAttribute('title', I18N[state.uiLang]?.ttsPlay || '음성 재생');
                wordTTSButton.onmouseover = function() { this.style.color = 'var(--accent-hover)'; };
                wordTTSButton.onmouseout = function() { this.style.color = 'var(--accent-primary)'; };
                const wordTTSIcon = document.createElement('i');
                wordTTSIcon.className = 'fas fa-volume-high text-xs';
                wordTTSIcon.setAttribute('aria-hidden', 'true');
                wordTTSButton.appendChild(wordTTSIcon);

                // TTS 버튼 클릭 이벤트
                wordTTSButton.addEventListener('click', () => {
                    const wordLang = determineWordLanguage(item, detectedSource, targetLang);
                    playTTS(item.word, wordLang);
                });

                // 저장 버튼
                const saveButton = document.createElement('button');
                saveButton.className = 'transition';
                saveButton.style.color = 'var(--accent-secondary)';
                saveButton.setAttribute('aria-label', I18N[state.uiLang]?.saveWord || '단어 저장');
                saveButton.setAttribute('title', I18N[state.uiLang]?.saveWord || '단어 저장');
                saveButton.onmouseover = function() { this.style.color = 'var(--accent-primary)'; };
                saveButton.onmouseout = function() { this.style.color = 'var(--accent-secondary)'; };
                const saveIcon = document.createElement('i');

                // 저장 상태 확인하여 아이콘 설정
                const wordLangForItem = determineWordLanguage(item, detectedSource, targetLang);
                const cacheKey = `${item.word}_${wordLangForItem}`;
                const isWordSaved = savedWordsMap.get(cacheKey) || false;

                if (isWordSaved) {
                    // 저장된 단어: 채워진 아이콘
                    saveIcon.className = 'fas fa-bookmark text-xs';
                    saveIcon.style.color = 'var(--accent-primary)';
                } else {
                    // 저장되지 않은 단어: 빈 아이콘
                    saveIcon.className = 'far fa-bookmark text-xs';
                    saveIcon.style.color = 'var(--text-tertiary)';
                }

                saveIcon.setAttribute('aria-hidden', 'true');
                saveButton.appendChild(saveIcon);

                // 저장 버튼 클릭 이벤트
                saveButton.addEventListener('click', async () => {
                    const wordLangForSave = determineWordLanguage(item, detectedSource, targetLang);
                    const cacheKey = `${item.word}_${wordLangForSave}`;
                    const wasSaved = savedWordsMap.get(cacheKey) || false;

                    const result = await saveWordToVocabulary({
                        word: item.word,
                        meaning: item.meaning,
                        pronunciation: item.pronunciation || null,
                        language: wordLangForSave
                    }, saveButton, saveIcon);

                    // DB 작업 완료 후 토스트 메시지 표시
                    if (result.success) {
                        if (result.action === 'delete') {
                            showToast(I18N[state.uiLang]?.wordDeleted || '단어가 삭제되었습니다.');
                        } else if (result.action === 'save') {
                            showToast(I18N[state.uiLang]?.wordSaved || '단어가 저장되었습니다.');
                        }
                    } else {
                        showToast(result.error || '작업에 실패했습니다.');
                    }

                    // 캐시 새로고침하여 상태 업데이트 후 아이콘 갱신
                    savedWordsCache.delete(wordLangForSave);
                    const updatedSavedWords = await getSavedWords(wordLangForSave); // Set
                    savedWordsMap.clear();
                    updatedSavedWords.forEach(word => {
                        savedWordsMap.set(`${word}_${wordLangForSave}`, true);
                    });

                    const isNowSaved = updatedSavedWords.has(item.word);
                    if (isNowSaved) {
                        saveIcon.className = 'fas fa-bookmark text-xs';
                        saveIcon.style.color = 'var(--accent-primary)';
                    } else {
                        saveIcon.className = 'far fa-bookmark text-xs';
                        saveIcon.style.color = 'var(--text-tertiary)';
                    }
                });

                buttonGroup.appendChild(wordTTSButton);
                buttonGroup.appendChild(saveButton);
                wordDiv.appendChild(buttonGroup);
            }

            // Meaning div
            const meaningDiv = document.createElement('div');
            meaningDiv.className = 'text-xs mb-1';
            meaningDiv.style.color = 'var(--text-secondary)';
            const meaningLabel = document.createElement('span');
            meaningLabel.style.color = 'var(--text-tertiary)';
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
                exampleDiv.className = 'flex items-start gap-2 text-xs italic mt-1';
                exampleDiv.style.color = 'var(--text-tertiary)';
                const exampleContentDiv = document.createElement('div');
                exampleContentDiv.className = 'flex-1';
                const exampleLabel = document.createElement('span');
                exampleLabel.style.color = 'var(--text-tertiary)';
                const exampleLabelText = I18N[state.uiLang]?.example || '예문';
                safeSetText(exampleLabel, `${exampleLabelText}: `);
                const exampleText = document.createTextNode(item.example);
                exampleContentDiv.appendChild(exampleLabel);
                exampleContentDiv.appendChild(exampleText);
                exampleDiv.appendChild(exampleContentDiv);

                // TTS 버튼 추가 (예문)
                const originalExampleText = extractOriginalTextFromExample(item.example);
                if (originalExampleText) {
                    const exampleTTSButton = document.createElement('button');
                    exampleTTSButton.className = 'transition flex-shrink-0 mt-0.5';
                    exampleTTSButton.style.color = 'var(--accent-primary)';
                    exampleTTSButton.onmouseover = function() { this.style.color = 'var(--accent-hover)'; };
                    exampleTTSButton.onmouseout = function() { this.style.color = 'var(--accent-primary)'; };
                    exampleTTSButton.setAttribute('aria-label', I18N[state.uiLang]?.ttsPlay || '음성 재생');
                    exampleTTSButton.setAttribute('title', I18N[state.uiLang]?.ttsPlay || '음성 재생');
                    const exampleTTSIcon = document.createElement('i');
                    exampleTTSIcon.className = 'fas fa-volume-high text-xs';
                    exampleTTSIcon.setAttribute('aria-hidden', 'true');
                    exampleTTSButton.appendChild(exampleTTSIcon);

                    // TTS 버튼 클릭 이벤트
                    exampleTTSButton.addEventListener('click', () => {
                        const exampleLang = determineWordLanguage(item, detectedSource, targetLang);
                        playTTS(originalExampleText, exampleLang);
                    });

                    exampleDiv.appendChild(exampleTTSButton);
                }

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

// -------------------------
// Realtime UI Rendering
// -------------------------

function updateRealtimeLangButtons() {
    const sourceBtns = document.querySelectorAll('.rt-source');
    const targetBtns = document.querySelectorAll('.rt-target');
    sourceBtns.forEach(btn => {
        const lang = btn.getAttribute('data-rt-lang');
        const active = lang === state.realtimeSourceLang;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    targetBtns.forEach(btn => {
        const lang = btn.getAttribute('data-rt-lang');
        const active = lang === state.realtimeTargetLang;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function setRealtimeLoading(isLoading) {
    const loading = document.getElementById('rt-loading');
    if (loading) loading.classList.toggle('hidden', !isLoading);
}

function renderRealtimeOutput() {
    const outEl = document.getElementById('rt-output');
    const detectEl = document.getElementById('rt-detected');
    if (outEl) safeSetText(outEl, state.realtimeResult || '');
    if (detectEl) {
        if (state.realtimeDetectedSource) {
            detectEl.classList.remove('hidden');
            safeSetText(detectEl, (state.realtimeDetectedSource || '').toUpperCase());
        } else {
            detectEl.classList.add('hidden');
        }
    }
}

async function renderRealtimeWordGuide(list, containerId, detectedSource, targetLang) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!list || !list.length) {
        const empty = document.createElement('div');
        empty.className = 'text-sm';
        empty.style.color = 'var(--text-tertiary)';
        empty.textContent = I18N[state.uiLang]?.noWords || '단어가 없습니다.';
        container.appendChild(empty);
        return;
    }

    const savedStatuses = await Promise.all(list.map(async (item) => {
        const wLang = determineWordLanguage(item, detectedSource, targetLang);
        const saved = await getSavedWords(wLang);
        return { key: item.word, lang: wLang, isSaved: saved.has(item.word) };
    }));
    const savedMap = new Map();
    savedStatuses.forEach(s => savedMap.set(`${s.key}_${s.lang}`, s.isSaved));

    list.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'p-2 rounded-lg';
        card.style.border = '1px solid var(--border-color)';
        card.style.background = 'var(--bg-secondary)';

        const top = document.createElement('div');
        top.className = 'flex items-center gap-2 mb-1';

        const wordSpan = document.createElement('span');
        wordSpan.className = 'font-bold text-sm';
        wordSpan.style.color = 'var(--text-primary)';
        safeSetText(wordSpan, `${idx + 1}. ${item.word || ''}`);
        top.appendChild(wordSpan);

        if (item.pronunciation) {
            const pron = document.createElement('span');
            pron.className = 'text-xs';
            pron.style.color = 'var(--accent-primary)';
            safeSetText(pron, item.pronunciation);
            top.appendChild(pron);
        }

        const btnWrap = document.createElement('div');
        btnWrap.className = 'flex gap-2 ml-auto';

        const langForItem = determineWordLanguage(item, detectedSource, targetLang);

        const ttsBtn = document.createElement('button');
        ttsBtn.className = 'transition';
        ttsBtn.style.color = 'var(--accent-primary)';
        ttsBtn.innerHTML = '<i class="fas fa-volume-high text-xs"></i>';
        ttsBtn.onclick = () => playTTS(item.word, langForItem);
        btnWrap.appendChild(ttsBtn);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'transition';
        copyBtn.style.color = 'var(--text-tertiary)';
        copyBtn.innerHTML = '<i class="far fa-copy text-xs"></i>';
        copyBtn.onclick = () => copyText(item.word);
        btnWrap.appendChild(copyBtn);

        const saveBtn = document.createElement('button');
        saveBtn.className = 'transition';
        const cacheKey = `${item.word}_${langForItem}`;
        const isSaved = savedMap.get(cacheKey) || false;
        saveBtn.innerHTML = isSaved
            ? '<i class="fas fa-bookmark text-xs" style="color: var(--accent-primary);"></i>'
            : '<i class="far fa-bookmark text-xs" style="color: var(--text-tertiary);"></i>';
        saveBtn.onclick = async () => {
            const result = await saveWordToVocabulary({
                word: item.word,
                meaning: item.meaning,
                pronunciation: item.pronunciation || null,
                language: langForItem
            });
            // 저장/삭제 후 캐시 갱신
            savedWordsCache.delete(langForItem);
            const refreshed = await getSavedWords(langForItem);
            const nowSaved = refreshed.has(item.word);
            saveBtn.innerHTML = nowSaved
                ? '<i class="fas fa-bookmark text-xs" style="color: var(--accent-primary);"></i>'
                : '<i class="far fa-bookmark text-xs" style="color: var(--text-tertiary);"></i>';
        };
        btnWrap.appendChild(saveBtn);

        top.appendChild(btnWrap);
        card.appendChild(top);

        if (item.meaning) {
            const meaning = document.createElement('div');
            meaning.className = 'text-xs mb-1';
            meaning.style.color = 'var(--text-secondary)';
            meaning.textContent = `의미: ${item.meaning}`;
            card.appendChild(meaning);
        }
        if (item.example) {
            const ex = document.createElement('div');
            ex.className = 'text-xs';
            ex.style.color = 'var(--text-tertiary)';
            ex.textContent = `예문: ${item.example}`;
            card.appendChild(ex);
        }

        container.appendChild(card);
    });
}

function renderRealtimeWordGuides() {
    renderRealtimeWordGuide(
        state.realtimeWordGuideSource,
        'rt-word-guide-source',
        state.realtimeDetectedSource || state.realtimeSourceLang,
        state.realtimeSourceLang
    );
    renderRealtimeWordGuide(
        state.realtimeWordGuideTarget,
        'rt-word-guide-target',
        state.realtimeTargetLang,
        state.realtimeTargetLang
    );

    const sourceCount = document.getElementById('rt-source-count');
    const targetCount = document.getElementById('rt-target-count');
    if (sourceCount) sourceCount.textContent = state.realtimeWordGuideSource?.length ? `${state.realtimeWordGuideSource.length}개` : '';
    if (targetCount) targetCount.textContent = state.realtimeWordGuideTarget?.length ? `${state.realtimeWordGuideTarget.length}개` : '';
}

/**
 * 실시간 번역 UI 초기화
 */
function initRealtimeUI() {
    const inputEl = document.getElementById('rt-input');
    const swapBtn = document.getElementById('rt-swap-btn');
    const inputCopy = document.getElementById('rt-input-copy');
    const inputTTS = document.getElementById('rt-input-tts');
    const inputClear = document.getElementById('rt-input-clear');
    const outputCopy = document.getElementById('rt-output-copy');
    const outputTTS = document.getElementById('rt-output-tts');

    document.querySelectorAll('.rt-source').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-rt-lang');
            setRealtimeSourceLang(lang);
        });
    });
    document.querySelectorAll('.rt-target').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-rt-lang');
            setRealtimeTargetLang(lang);
        });
    });
    if (swapBtn) swapBtn.addEventListener('click', swapRealtimeLang);

    if (inputEl) {
        inputEl.addEventListener('input', (e) => handleRealtimeInput(e.target.value));
    }
    if (inputCopy) inputCopy.addEventListener('click', () => copyText(state.realtimeText));
    if (inputTTS) inputTTS.addEventListener('click', () => playTTS(state.realtimeText, state.realtimeSourceLang === 'auto' ? 'ko' : state.realtimeSourceLang));
    if (inputClear) inputClear.addEventListener('click', () => {
        if (inputEl) inputEl.value = '';
        handleRealtimeInput('');
    });
    if (outputCopy) outputCopy.addEventListener('click', () => copyText(state.realtimeResult));
    if (outputTTS) outputTTS.addEventListener('click', () => playTTS(state.realtimeResult, state.realtimeTargetLang));

    updateRealtimeLangButtons();
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

        // API 키 로드 (secrets.js에서)
        try {
            if (typeof SECRETS !== 'undefined' && SECRETS.GEMINI_API_KEY) {
                state.apiKey = SECRETS.GEMINI_API_KEY;
            } else {
                state.apiKey = defaultApiKey;
            }
        } catch (error) {
            console.error('init: Error loading API key from secrets:', error);
            state.apiKey = defaultApiKey;
        }

        // Supabase 클라이언트 초기화
        try {
            initSupabase();
        } catch (error) {
            console.error('init: Error initializing Supabase:', error);
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
            setActiveBtn('nuance-group', 'polite');
        } catch (error) {
            console.error('init: Error setting active button:', error);
        }

        // UI 언어 설정
        try {
            setUILang('ko');
        } catch (error) {
            console.error('init: Error setting UI language:', error);
        }

        // 실시간 번역 UI 초기화
        try {
            initRealtimeUI();
        } catch (error) {
            console.error('init: Error initializing realtime UI:', error);
        }

        // 언어/톤 모달 트리거
        try {
            const srcBtn = document.getElementById('source-trigger');
            const tgtBtn = document.getElementById('target-trigger');
            const toneBtn = document.getElementById('tone-trigger');
            if (srcBtn) srcBtn.addEventListener('click', (e) => openSelectorModal('source', e.currentTarget));
            if (tgtBtn) tgtBtn.addEventListener('click', (e) => openSelectorModal('target', e.currentTarget));
            if (toneBtn) toneBtn.addEventListener('click', (e) => openSelectorModal('tone', e.currentTarget));
            updateLangToneLabels();
        } catch (error) {
            console.error('init: Error binding selector modal triggers:', error);
        }

        // 모달 닫기 (배경, ESC)
        try {
            const backdrop = document.getElementById('selector-modal-backdrop');
            const closeBtn = document.getElementById('selector-modal-close');
            if (backdrop) {
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) closeSelectorModal();
                });
            }
            if (closeBtn) closeBtn.addEventListener('click', closeSelectorModal);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.selectorModalOpen) {
                    closeSelectorModal();
                }
            });
        } catch (error) {
            console.error('init: Error binding modal close handlers:', error);
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

    } catch (error) {
        console.error('init: Critical initialization error:', error);
    }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init);

